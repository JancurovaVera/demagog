import * as React from 'react';

import {
  Button,
  Callout,
  Classes,
  Colors,
  FormGroup,
  Intent,
  Position,
  Switch,
  Tooltip,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { ApolloError } from 'apollo-client';
import * as classNames from 'classnames';
import { css } from 'emotion';
import { Formik } from 'formik';
import { get, isEqual, set } from 'lodash';
import { Mutation, Query } from 'react-apollo';
import { connect, Dispatch } from 'react-redux';
import { Link, RouteComponentProps } from 'react-router-dom';

import { addFlashMessage } from '../actions/flashMessages';
import { isAuthorized } from '../authorization';
import {
  ASSESSMENT_STATUS_APPROVAL_NEEDED,
  ASSESSMENT_STATUS_APPROVED,
  ASSESSMENT_STATUS_BEING_EVALUATED,
  ASSESSMENT_STATUS_LABELS,
} from '../constants';
import {
  GetStatementQuery,
  UpdateStatementInputType,
  UpdateStatementMutation,
  UpdateStatementMutationVariables,
} from '../operation-result-types';
import { UpdateStatement } from '../queries/mutations';
import { GetStatement } from '../queries/queries';
import { IState as ReduxState } from '../reducers';
import { displayDate, newlinesToBr } from '../utils';
import UserSelect from './forms/controls/UserSelect';
import VeracitySelect from './forms/controls/VeracitySelect';
import FormikAutoSave from './forms/FormikAutoSave';
import Loading from './Loading';
import RichTextEditor from './RichTextEditor';
import StatementComments from './StatementComments';

// Little more than 10s so it does not sync with other polls
const GET_STATEMENT_POLL_INTERVAL = 10150;

const IS_EDITING_DEBOUNCE_TIMEOUT = 10000;
const UPDATE_STATEMENT_DEBOUNCE_TIMEOUT = 2000;

class UpdateStatementMutationComponent extends Mutation<
  UpdateStatementMutation,
  UpdateStatementMutationVariables
> {}

class GetStatementQueryComponent extends Query<GetStatementQuery> {}

const VERACITY_COLORS = {
  true: Colors.COBALT2,
  untrue: Colors.RED3,
  misleading: Colors.GOLD5,
  unverifiable: Colors.BLUE5,
};

interface IProps extends RouteComponentProps<{ id: string }> {
  currentUser: ReduxState['currentUser']['user'];
  dispatch: Dispatch;
  isAuthorized: (permissions: string[]) => boolean;
}

interface IState {
  isEditing: boolean;
}

class StatementDetail extends React.Component<IProps, IState> {
  public updateStatementTimeoutId: number | null = null;
  public updateStatementPromise: Promise<any> | null = null;
  public isEditingTimeoutId: number | null = null;

  public state: IState = {
    isEditing: false,
  };

  public componentWillUnmount() {
    // TODO: what if there are pending changes?
    if (this.updateStatementTimeoutId !== null) {
      window.clearTimeout(this.updateStatementTimeoutId);
    }
    if (this.isEditingTimeoutId !== null) {
      window.clearTimeout(this.isEditingTimeoutId);
    }
  }

  public render() {
    const statementId = this.props.match.params.id;

    return (
      <GetStatementQueryComponent
        query={GetStatement}
        variables={{ id: parseInt(statementId, 10) }}
      >
        {({ data, loading, error, stopPolling, startPolling }) => {
          if (error) {
            console.error(error); // tslint:disable-line:no-console
          }

          if (loading) {
            return <Loading />;
          }

          if (!data) {
            return null;
          }

          const statement = data.statement;

          const initialValues = {
            _isEditing: false,
            content: statement.content,
            published: statement.published,
            important: statement.important,
            count_in_statistics: statement.count_in_statistics,
            assessment: {
              evaluation_status: statement.assessment.evaluation_status,
              veracity_id: statement.assessment.veracity ? statement.assessment.veracity.id : null,
              short_explanation: statement.assessment.short_explanation,
              explanation_html: statement.assessment.explanation_html,
              explanation_slatejson: statement.assessment.explanation_slatejson,
              evaluator_id: statement.assessment.evaluator
                ? statement.assessment.evaluator.id
                : null,
            },
          };
          let enableReinitialize = true;

          if (this.state.isEditing) {
            // When user is editing, we don't let formik reinitialize values,
            // so users do not lose anything they are writing. But after he's
            // done editing (no change in 10s), we let formik reinitialize with
            // latest values and use the _isEditing field to do change in
            // initialValues so resetForm is triggered in formik's
            // componentDidUpdate.
            initialValues._isEditing = true;
            enableReinitialize = false;
          }

          if (!this.state.isEditing) {
            startPolling(GET_STATEMENT_POLL_INTERVAL);
          }

          return (
            <UpdateStatementMutationComponent mutation={UpdateStatement}>
              {(updateStatement) => (
                <Formik
                  initialValues={initialValues}
                  enableReinitialize={enableReinitialize}
                  onSubmit={(values, { setSubmitting, resetForm }) => {
                    stopPolling();
                    this.setState({ isEditing: true });

                    if (this.isEditingTimeoutId !== null) {
                      window.clearTimeout(this.isEditingTimeoutId);
                    }

                    this.isEditingTimeoutId = window.setTimeout(() => {
                      startPolling(GET_STATEMENT_POLL_INTERVAL);
                      this.setState({ isEditing: false });
                      this.isEditingTimeoutId = null;
                    }, IS_EDITING_DEBOUNCE_TIMEOUT);

                    if (this.updateStatementTimeoutId !== null) {
                      window.clearTimeout(this.updateStatementTimeoutId);
                      this.updateStatementTimeoutId = null;
                    }

                    this.updateStatementTimeoutId = window.setTimeout(() => {
                      this.updateStatementTimeoutId = null;

                      setSubmitting(true);

                      const statementInput: UpdateStatementInputType = {};

                      const paths = [
                        'assessment.veracity_id',
                        'assessment.short_explanation',
                        'assessment.evaluator_id',
                        'assessment.evaluation_status',
                        'assessment.explanation_slatejson',
                        'assessment.explanation_html',
                        'count_in_statistics',
                        'published',
                        'content',
                        'important',
                      ];

                      paths.forEach((path) => {
                        if (!isEqual(get(initialValues, path), get(values, path))) {
                          set(statementInput, path, get(values, path));
                        }
                      });

                      this.updateStatementPromise = updateStatement({
                        variables: { id: parseInt(statement.id, 10), statementInput },
                      })
                        .then(() => {
                          setSubmitting(false);
                        })
                        .catch((mutationError: ApolloError) => {
                          setSubmitting(false);
                          resetForm();

                          this.props.dispatch(
                            addFlashMessage(
                              'Nepodařilo se uložit tvoji poslední změnu, zkus to prosím znovu',
                              'error',
                            ),
                          );
                          console.error(mutationError); // tslint:disable-line:no-console
                        })
                        .finally(() => {
                          this.updateStatementPromise = null;
                        });
                    }, UPDATE_STATEMENT_DEBOUNCE_TIMEOUT);
                  }}
                >
                  {({
                    handleChange,
                    handleBlur,
                    values,
                    setFieldValue,
                    setFieldTouched,
                    submitForm,
                    isSubmitting,
                  }) => {
                    const canEditEverything = this.props.isAuthorized(['statements:edit']);
                    const canEditAsEvaluator =
                      values.assessment.evaluator_id !== null &&
                      this.props.currentUser !== null &&
                      this.props.currentUser.id === values.assessment.evaluator_id &&
                      this.props.isAuthorized(['statements:edit-as-evaluator']);
                    const canEditTexts = this.props.isAuthorized(['statements:edit-texts']);

                    const isApproved =
                      values.assessment.evaluation_status === ASSESSMENT_STATUS_APPROVED;
                    const isBeingEvaluated =
                      values.assessment.evaluation_status === ASSESSMENT_STATUS_BEING_EVALUATED;
                    const isApprovalNeeded =
                      values.assessment.evaluation_status === ASSESSMENT_STATUS_APPROVAL_NEEDED;

                    const canEditStatementContent =
                      ((canEditEverything || canEditTexts) && !isApproved) ||
                      (canEditAsEvaluator && isBeingEvaluated);
                    const canEditVeracity =
                      (canEditEverything && !isApproved) ||
                      (canEditAsEvaluator && isBeingEvaluated);
                    const canEditExplanations =
                      ((canEditEverything || canEditTexts) && !isApproved) ||
                      (canEditAsEvaluator && isBeingEvaluated);
                    const canEditEvaluator = canEditEverything && isBeingEvaluated;
                    const canEditPublished = canEditEverything && isApproved;
                    const canEditImportant = canEditEverything;
                    const canEditCountInStatistics = canEditEverything;

                    const isApprovedAndNotPublished = isApproved && !values.published;
                    const isBeingEvaluatedAndEvaluationFilled =
                      isBeingEvaluated &&
                      (values.assessment.veracity_id &&
                        values.assessment.short_explanation &&
                        values.assessment.explanation_html);

                    const canEditStatus =
                      (canEditEverything &&
                        (isApprovedAndNotPublished ||
                          isBeingEvaluatedAndEvaluationFilled ||
                          isApprovalNeeded)) ||
                      (canEditAsEvaluator && isBeingEvaluatedAndEvaluationFilled);

                    let statusTooltipContent: string | null = null;
                    if (canEditEverything && isBeingEvaluated && !canEditStatus) {
                      statusTooltipContent =
                        'Aby šel výrok posunout ke kontrole, ' +
                        'musí být vyplněné hodnocení a odůvodnění, včetně zkráceného';
                    }
                    if (canEditEverything && isApproved && !canEditStatus) {
                      statusTooltipContent =
                        'Aby šel výrok vrátit ke zpracování, nesmí být zveřejněný';
                    }

                    const canViewEvaluation =
                      canEditAsEvaluator ||
                      isApproved ||
                      this.props.isAuthorized(['statements:view-unapproved-evaluation']);

                    const canEditSomething =
                      canEditStatementContent ||
                      canEditVeracity ||
                      canEditExplanations ||
                      canEditEvaluator ||
                      canEditPublished ||
                      canEditImportant ||
                      canEditStatus;

                    return (
                      <div style={{ padding: '15px 0 40px 0' }}>
                        <FormikAutoSave
                          submitForm={submitForm}
                          values={values}
                          initialValues={initialValues}
                        />
                        <div style={{ float: 'right' }}>
                          <Link
                            to={`/admin/sources/${statement.source.id}`}
                            className={Classes.BUTTON}
                          >
                            Zpět na diskuzi
                          </Link>
                        </div>

                        <div style={{ display: 'flex' }}>
                          <h2 className={Classes.HEADING}>Detail výroku</h2>

                          {canEditSomething && (
                            <div
                              className={Classes.TEXT_MUTED}
                              style={{ marginLeft: 20, marginTop: 12 }}
                            >
                              {isSubmitting ? 'Ukládám změny ...' : 'Změny úspěšně uloženy'}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', marginTop: 20, marginBottom: 30 }}>
                          <div style={{ flex: '2 0' }}>
                            <h5 className={Classes.HEADING}>
                              {statement.speaker.first_name} {statement.speaker.last_name}
                            </h5>
                            {canEditStatementContent ? (
                              <textarea
                                className={classNames(Classes.INPUT, Classes.FILL)}
                                style={{ marginBottom: 5 }}
                                name="content"
                                rows={4}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.content || ''}
                              />
                            ) : (
                              <p>{newlinesToBr(values.content)}</p>
                            )}
                            <p className={Classes.TEXT_MUTED}>
                              Diskuze: {statement.source.name}, {statement.source.medium.name},{' '}
                              {displayDate(statement.source.released_at)},{' '}
                              {statement.source.media_personality.name}
                              {statement.source.source_url && (
                                <>
                                  , <a href={statement.source.source_url}>odkaz</a>
                                </>
                              )}
                              {' — '}
                              {statement.statement_transcript_position ? (
                                <Link
                                  to={`/admin/sources/${
                                    statement.source.id
                                  }/statements-from-transcript?highlightStatementId=${
                                    statement.id
                                  }`}
                                >
                                  Ukázat výrok v kontextu přepisu
                                </Link>
                              ) : (
                                <>Výrok nelze ukázat v kontextu přepisu, je vytvořený ručně</>
                              )}
                            </p>

                            <hr
                              style={{
                                borderTop: '2px solid #ccc',
                                marginTop: 30,
                                marginBottom: 30,
                              }}
                            />

                            {(canEditVeracity || canEditExplanations || canViewEvaluation) && (
                              <>
                                {canEditVeracity ? (
                                  <FormGroup label="Hodnocení" labelFor="veracity">
                                    <VeracitySelect
                                      id="veracity"
                                      disabled={
                                        values.assessment.evaluation_status ===
                                        ASSESSMENT_STATUS_APPROVED
                                      }
                                      onChange={(value) =>
                                        setFieldValue('assessment.veracity_id', value)
                                      }
                                      onBlur={() => setFieldTouched('assessment.veracity_id')}
                                      value={values.assessment.veracity_id}
                                    />
                                  </FormGroup>
                                ) : (
                                  <p>
                                    {!statement.assessment.veracity && 'Zatím nehodnoceno'}

                                    {statement.assessment.veracity && (
                                      <span
                                        className={Classes.TEXT_LARGE}
                                        style={{
                                          color: VERACITY_COLORS[statement.assessment.veracity.key],
                                          fontWeight: 'bold',
                                        }}
                                      >
                                        {statement.assessment.veracity.name}
                                      </span>
                                    )}
                                  </p>
                                )}

                                {canEditExplanations ? (
                                  <FormGroup
                                    label="Odůvodnění zkráceně"
                                    labelFor="assessment-short-explanation"
                                    helperText="Maximálně na dlouhý tweet, tj. 280 znaků"
                                  >
                                    <textarea
                                      className={classNames(Classes.INPUT, Classes.FILL)}
                                      id="assessment-short-explanation"
                                      name="assessment.short_explanation"
                                      rows={3}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      value={values.assessment.short_explanation || ''}
                                    />
                                  </FormGroup>
                                ) : (
                                  <>
                                    <h6 className={Classes.HEADING}>Odůvodnění zkráceně</h6>
                                    <p>{values.assessment.short_explanation}</p>
                                  </>
                                )}

                                {canEditExplanations ? (
                                  <FormGroup label="Odůvodnění" labelFor="assessment-explanation">
                                    <RichTextEditor
                                      value={values.assessment.explanation_slatejson}
                                      html={values.assessment.explanation_html}
                                      onChange={(value, html) => {
                                        setFieldValue('assessment.explanation_slatejson', value);
                                        setFieldValue('assessment.explanation_html', html);
                                      }}
                                      statementExplanation
                                    />
                                  </FormGroup>
                                ) : (
                                  <>
                                    <h6 className={Classes.HEADING}>Odůvodnění</h6>
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: values.assessment.explanation_html || '',
                                      }}
                                      className={css`
                                        img {
                                          max-width: 100%;
                                        }
                                      `}
                                    />
                                  </>
                                )}
                              </>
                            )}
                            {!canEditVeracity &&
                              !canEditExplanations &&
                              !canViewEvaluation && (
                                <Callout intent={Intent.PRIMARY} icon={IconNames.INFO_SIGN}>
                                  Hodnocení a odůvodnění tohoto výroku můžete vidět teprve až po
                                  schválení
                                </Callout>
                              )}
                          </div>

                          <div style={{ flex: '1 0', marginLeft: 30 }}>
                            <div className={classNames(Classes.FORM_GROUP, Classes.INLINE)}>
                              <label className={Classes.LABEL} style={{ flex: '1' }}>
                                Stav
                              </label>
                              <div style={{ flex: '2', paddingTop: 6 }}>
                                <EvaluationStatusInput
                                  disabled={
                                    !canEditStatus ||
                                    // If initialValues and values status or published are not the same, it means
                                    // that there was a param change and it is not propagated to server yet,
                                    // so we wait for the propagation, because we cannot skip the evaluation
                                    // states when doing graphql mutations.
                                    initialValues.assessment.evaluation_status !==
                                      values.assessment.evaluation_status ||
                                    initialValues.published !== values.published
                                  }
                                  tooltipContent={statusTooltipContent}
                                  value={values.assessment.evaluation_status}
                                  onChange={(value) =>
                                    setFieldValue('assessment.evaluation_status', value)
                                  }
                                />
                              </div>
                            </div>

                            <div className={classNames(Classes.FORM_GROUP, Classes.INLINE)}>
                              <label className={Classes.LABEL} style={{ flex: '1' }}>
                                Expert
                              </label>
                              <div style={{ flex: '2', paddingTop: 6 }}>
                                {statement.source.expert ? (
                                  <>
                                    {statement.source.expert.first_name}{' '}
                                    {statement.source.expert.last_name}
                                  </>
                                ) : (
                                  <span className={Classes.TEXT_MUTED}>Nepřiřazený</span>
                                )}
                              </div>
                            </div>

                            <div className={classNames(Classes.FORM_GROUP, Classes.INLINE)}>
                              <label className={Classes.LABEL} style={{ flex: '1', paddingTop: 2 }}>
                                Ověřovatel/ka
                              </label>
                              <div style={{ flex: '2' }}>
                                {/* TODO: add tooltip to explain when the user select is disabled? */}
                                <UserSelect
                                  disabled={!canEditEvaluator}
                                  onChange={(value) =>
                                    setFieldValue('assessment.evaluator_id', value)
                                  }
                                  onBlur={() => setFieldTouched('assessment.evaluator_id')}
                                  value={values.assessment.evaluator_id}
                                />
                              </div>
                            </div>

                            <div
                              className={classNames(Classes.FORM_GROUP, Classes.INLINE)}
                              style={{
                                marginBottom: 5,
                                // flex-start needed to align switch with tooltip and without label correctly
                                alignItems: 'flex-start',
                              }}
                            >
                              <label
                                htmlFor="published"
                                className={Classes.LABEL}
                                style={{ flex: '1' }}
                              >
                                Zvěřejněný
                              </label>
                              <div className={Classes.FORM_CONTENT} style={{ flex: '2' }}>
                                <div style={{ display: 'inline-block' }}>
                                  <Tooltip
                                    disabled={canEditPublished}
                                    content="Aby šel výrok zveřejnit, musí být ve schváleném stavu"
                                    position={Position.TOP}
                                  >
                                    <Switch
                                      id="published"
                                      name="published"
                                      checked={values.published}
                                      onChange={handleChange}
                                      disabled={!canEditPublished}
                                    />
                                  </Tooltip>
                                </div>

                                {values.published && (
                                  <a
                                    href={`/vyrok/${statement.id}`}
                                    style={{
                                      display: 'inline-block',
                                      marginTop: 6,
                                      verticalAlign: 'top',
                                    }}
                                  >
                                    Veřejný odkaz
                                  </a>
                                )}
                              </div>
                            </div>

                            <hr style={{ borderTop: '2px solid #ccc' }} />

                            <div
                              className={classNames(Classes.FORM_GROUP, Classes.INLINE)}
                              style={{ marginTop: 10, marginBottom: 10 }}
                            >
                              <label
                                htmlFor="count_in_statistics"
                                className={classNames(Classes.LABEL, Classes.INLINE)}
                                style={{ flex: '1' }}
                              >
                                Ve&nbsp;statistikách
                              </label>
                              <div className={Classes.FORM_CONTENT} style={{ flex: '2' }}>
                                <Switch
                                  id="count_in_statistics"
                                  name="count_in_statistics"
                                  checked={values.count_in_statistics}
                                  onChange={handleChange}
                                  disabled={!canEditCountInStatistics}
                                />
                              </div>
                            </div>

                            <div
                              className={classNames(Classes.FORM_GROUP, Classes.INLINE)}
                              style={{
                                marginBottom: 10,
                                // flex-start needed to align switch without label correctly
                                alignItems: 'flex-start',
                              }}
                            >
                              <label
                                htmlFor="important"
                                className={Classes.LABEL}
                                style={{ flex: '1' }}
                              >
                                Důležitý
                              </label>
                              <div className={Classes.FORM_CONTENT} style={{ flex: '2' }}>
                                <Switch
                                  disabled={!canEditImportant}
                                  id="important"
                                  name="important"
                                  checked={values.important}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>

                            <hr style={{ borderTop: '2px solid #ccc' }} />

                            <StatementComments statementId={statement.id} />
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </Formik>
              )}
            </UpdateStatementMutationComponent>
          );
        }}
      </GetStatementQueryComponent>
    );
  }
}

interface IEvaluationStatusInputProps {
  disabled: boolean;
  tooltipContent: string | null;
  value: string;
  onChange: (value: string) => void;
}

class EvaluationStatusInput extends React.Component<IEvaluationStatusInputProps> {
  public onChange = (value: string) => () => {
    if (!this.props.disabled) {
      this.props.onChange(value);
    }
  };

  public render() {
    const { disabled, tooltipContent, value } = this.props;

    return (
      <>
        <p style={{ marginBottom: 5 }}>{ASSESSMENT_STATUS_LABELS[value]}</p>

        <Tooltip
          disabled={tooltipContent === null || !disabled}
          content={tooltipContent || ''}
          position={Position.TOP}
        >
          <>
            {value === ASSESSMENT_STATUS_BEING_EVALUATED && (
              <Button
                disabled={disabled}
                onClick={this.onChange(ASSESSMENT_STATUS_APPROVAL_NEEDED)}
                text="Posunout ke kontrole"
              />
            )}
            {value === ASSESSMENT_STATUS_APPROVAL_NEEDED && (
              <>
                <Button
                  disabled={disabled}
                  onClick={this.onChange(ASSESSMENT_STATUS_BEING_EVALUATED)}
                  text="Vrátit ke zpracování"
                />
                <Button
                  disabled={disabled}
                  onClick={this.onChange(ASSESSMENT_STATUS_APPROVED)}
                  text="Schválit"
                />
              </>
            )}
            {value === ASSESSMENT_STATUS_APPROVED && (
              <Button
                disabled={disabled}
                onClick={this.onChange(ASSESSMENT_STATUS_BEING_EVALUATED)}
                text="Vrátit ke zpracování"
              />
            )}
          </>
        </Tooltip>
      </>
    );
  }
}

const mapStateToProps = (state: ReduxState) => ({
  currentUser: state.currentUser.user,
  isAuthorized: isAuthorized(state.currentUser.user),
});

export default connect(mapStateToProps)(StatementDetail);