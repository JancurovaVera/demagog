/* eslint jsx-a11y/anchor-has-content: 0, jsx-a11y/anchor-is-valid: 0 */

import * as React from 'react';

import {
  Button,
  Classes,
  Menu,
  MenuDivider,
  MenuItem,
  NonIdealState,
  Popover,
  Position,
} from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { ApolloError } from 'apollo-client';
import { get, orderBy } from 'lodash';
import { Query } from 'react-apollo';
import { connect, Dispatch } from 'react-redux';
import { Link, RouteComponentProps } from 'react-router-dom';

import { addFlashMessage } from '../actions/flashMessages';
import {
  ASSESSMENT_STATUS_APPROVAL_NEEDED,
  ASSESSMENT_STATUS_APPROVED,
  ASSESSMENT_STATUS_BEING_EVALUATED,
} from '../constants';
import {
  GetSourceQuery,
  GetSourceStatementsQuery,
  GetSourceStatementsQueryVariables,
} from '../operation-result-types';
import { DeleteSource } from '../queries/mutations';
import { GetSource, GetSources, GetSourceStatements } from '../queries/queries';
import { displayDate } from '../utils';
import Authorize from './Authorize';
import Loading from './Loading';
import ConfirmDeleteModal from './modals/ConfirmDeleteModal';
import StatementCard from './StatementCard';

class GetSourceQueryComponent extends Query<GetSourceQuery> {}
class GetSourceStatementsQueryComponent extends Query<
  GetSourceStatementsQuery,
  GetSourceStatementsQueryVariables
> {}

const STATUS_FILTER_LABELS = {
  [ASSESSMENT_STATUS_BEING_EVALUATED]: 'Ve zpracování',
  [ASSESSMENT_STATUS_APPROVAL_NEEDED]: 'Ke kontrole',
  [ASSESSMENT_STATUS_APPROVED]: 'Schválené',
};

interface IProps extends RouteComponentProps<{ sourceId: string }> {
  dispatch: Dispatch;
}

interface IState {
  showConfirmDeleteModal: boolean;
  statementsFilter: null | {
    field: string;
    value: any;
  };
}

class SourceDetail extends React.Component<IProps, IState> {
  public state: IState = {
    showConfirmDeleteModal: false,
    statementsFilter: null,
  };

  public toggleConfirmDeleteModal = () => {
    this.setState({ showConfirmDeleteModal: !this.state.showConfirmDeleteModal });
  };

  public onDeleted = () => {
    this.props.dispatch(
      addFlashMessage('Diskuze včetně jejích výroků byla úspěšně smazána.', 'success'),
    );
    this.props.history.push(`/admin/sources`);
  };

  public onDeleteError = (error: ApolloError) => {
    this.props.dispatch(addFlashMessage('Doško k chybě při mazání diskuze', 'error'));

    console.error(error); // tslint:disable-line:no-console
  };

  public onStatementsFilterClick = (field: string, value: any) => (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    this.setState({ statementsFilter: { field, value } });

    event.preventDefault();
    return false;
  };

  public onCancelStatementsFilterClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    this.setState({ statementsFilter: null });

    event.preventDefault();
    return false;
  };

  public render() {
    return (
      <GetSourceQueryComponent
        query={GetSource}
        variables={{ id: parseInt(this.props.match.params.sourceId, 10) }}
      >
        {({ data, loading, error }) => {
          if (error) {
            console.error(error); // tslint:disable-line:no-console
          }

          if (loading) {
            return <Loading />;
          }

          if (!data) {
            return null;
          }

          const source = data.source;

          return (
            <div style={{ padding: '15px 0 40px 0' }}>
              {this.state.showConfirmDeleteModal && (
                <ConfirmDeleteModal
                  message={`Opravdu chcete smazat diskuzi ${
                    source.name
                  } se všemi výroky, které k ní patří?`}
                  onCancel={this.toggleConfirmDeleteModal}
                  mutation={DeleteSource}
                  mutationProps={{
                    variables: { id: source.id },
                    refetchQueries: [
                      {
                        query: GetSource,
                        variables: { id: parseInt(source.id, 10) },
                      },
                      {
                        query: GetSources,
                        variables: { name: null },
                      },
                    ],
                    onCompleted: this.onDeleted,
                    onError: this.onDeleteError,
                  }}
                />
              )}

              <div>
                <div style={{ float: 'right' }}>
                  <Link to="/admin/sources" className={Classes.BUTTON}>
                    Zpět
                  </Link>
                  <Authorize permissions={['sources:edit']}>
                    <>
                      <Link
                        to={`/admin/sources/edit/${source.id}`}
                        className={Classes.BUTTON}
                        style={{ marginLeft: 7 }}
                      >
                        Upravit údaje o diskuzi
                      </Link>
                      <button
                        type="button"
                        className={Classes.BUTTON}
                        style={{ marginLeft: 7 }}
                        onClick={this.toggleConfirmDeleteModal}
                      >
                        Smazat diskuzi
                      </button>
                    </>
                  </Authorize>
                </div>

                <h2 className={Classes.HEADING}>{source.name}</h2>

                <span>
                  {source.medium.name}, {displayDate(source.released_at)},{' '}
                  {source.media_personality.name}
                  {source.source_url && (
                    <>
                      , <a href={source.source_url}>odkaz</a>
                    </>
                  )}
                  {source.expert && (
                    <>
                      <br />
                      Expert: {source.expert.first_name} {source.expert.last_name}
                    </>
                  )}
                </span>
              </div>

              {this.renderStatements(source)}
            </div>
          );
        }}
      </GetSourceQueryComponent>
    );
  }

  public renderStatements(source) {
    const { statementsFilter } = this.state;

    return (
      <GetSourceStatementsQueryComponent
        query={GetSourceStatements}
        variables={{ sourceId: parseInt(source.id, 10) }}
      >
        {({ data, loading, error, refetch }) => {
          if (error) {
            console.error(error); // tslint:disable-line:no-console
          }

          if (loading) {
            return <Loading />;
          }

          if (!data) {
            return null;
          }

          if (data.statements.length === 0) {
            return (
              <div style={{ marginTop: 50 }}>
                <NonIdealState title="Zatím tu nejsou žádné výroky">
                  <Link
                    to={`/admin/sources/${source.id}/statements-from-transcript`}
                    className={Classes.BUTTON}
                  >
                    Přidat výroky výběrem z přepisu
                  </Link>
                  <div style={{ margin: '5px 0' }}>nebo</div>
                  <Link
                    to={`/admin/sources/${source.id}/statements/new`}
                    className={Classes.BUTTON}
                  >
                    Přidat výrok ručně
                  </Link>
                </NonIdealState>
              </div>
            );
          }

          const statusFilterOptions = Object.keys(STATUS_FILTER_LABELS).map((statusKey) => ({
            value: statusKey,
            label: STATUS_FILTER_LABELS[statusKey],
            count: data.statements.filter(
              (statement) => statement.assessment.evaluation_status === statusKey,
            ).length,
            active:
              statementsFilter !== null &&
              statementsFilter.field === 'assessment.evaluation_status' &&
              statementsFilter.value === statusKey,
          }));

          const publishedFilterOptions = [false, true].map((value) => ({
            value,
            label: value ? 'Zveřejněné' : 'Nezveřejněné',
            count: data.statements.filter((statement) => statement.published === value).length,
            active:
              statementsFilter !== null &&
              statementsFilter.field === 'published' &&
              statementsFilter.value === value,
          }));

          const evaluators = data.statements.reduce((carry, statement) => {
            if (statement.assessment.evaluator && !carry[statement.assessment.evaluator.id]) {
              carry[statement.assessment.evaluator.id] = statement.assessment.evaluator;
            }
            return carry;
          }, {});

          let evaluatorFilterOptions = Object.keys(evaluators).map((evaluatorId) => ({
            value: evaluatorId,
            label: `${evaluators[evaluatorId].first_name} ${evaluators[evaluatorId].last_name}`,
            count: data.statements.filter(
              (statement) =>
                statement.assessment.evaluator && statement.assessment.evaluator.id === evaluatorId,
            ).length,
            active:
              statementsFilter !== null &&
              statementsFilter.field === 'assessment.evaluator.id' &&
              statementsFilter.value === evaluatorId,
          }));

          evaluatorFilterOptions = orderBy(
            evaluatorFilterOptions,
            ['count', 'label'],
            ['desc', 'asc'],
          );

          const statementsToDisplay = data.statements.filter((statement) => {
            if (statementsFilter !== null) {
              return get(statement, statementsFilter.field) === statementsFilter.value;
            } else {
              return true;
            }
          });

          return (
            <>
              <Authorize permissions={['statements:add', 'statements:sort']}>
                <div style={{ display: 'flex', marginTop: 30 }}>
                  <div style={{ flex: '0 0 220px', marginRight: 15 }}>
                    <Authorize permissions={['statements:add']}>
                      <Popover
                        content={
                          <Menu>
                            <Link
                              to={`/admin/sources/${source.id}/statements-from-transcript`}
                              className={Classes.MENU_ITEM}
                            >
                              Přidat výroky výběrem z přepisu
                            </Link>
                            <Link
                              to={`/admin/sources/${source.id}/statements/new`}
                              className={Classes.MENU_ITEM}
                            >
                              Přidat výrok ručně
                            </Link>
                          </Menu>
                        }
                        minimal
                        position={Position.BOTTOM_LEFT}
                      >
                        <Button icon={IconNames.PLUS} text="Přidat výrok" />
                      </Popover>
                    </Authorize>
                  </div>
                  <div style={{ flex: '1 1' }}>
                    <Authorize permissions={['statements:sort']}>
                      <div style={{ float: 'right' }}>
                        <Link
                          to={`/admin/sources/${source.id}/statements-sort`}
                          className={Classes.BUTTON}
                        >
                          Seřadit výroky
                        </Link>
                      </div>
                    </Authorize>
                  </div>
                </div>
              </Authorize>

              <div style={{ display: 'flex', marginTop: 22, marginBottom: 50 }}>
                <div style={{ flex: '0 0 220px', marginRight: 15 }}>
                  <div className={Classes.LIST_UNSTYLED}>
                    <MenuItem
                      active={statementsFilter === null}
                      text={`Všechny výroky (${data.statements.length})`}
                      onClick={this.onCancelStatementsFilterClick}
                    />

                    <MenuDivider title="Filtrovat dle stavu" />
                    {statusFilterOptions.map((option) => (
                      <MenuItem
                        key={option.value}
                        active={option.active}
                        text={`${option.label} (${option.count})`}
                        onClick={this.onStatementsFilterClick(
                          'assessment.evaluation_status',
                          option.value,
                        )}
                      />
                    ))}

                    <MenuDivider title="Filtrovat dle zveřejnění" />
                    {publishedFilterOptions.map((option) => (
                      <MenuItem
                        key={String(option.value)}
                        active={option.active}
                        text={`${option.label} (${option.count})`}
                        onClick={this.onStatementsFilterClick('published', option.value)}
                      />
                    ))}

                    <MenuDivider title="Filtrovat dle ověřovatele" />
                    {evaluatorFilterOptions.map((option) => (
                      <MenuItem
                        key={option.value}
                        active={option.active}
                        text={`${option.label} (${option.count})`}
                        onClick={this.onStatementsFilterClick(
                          'assessment.evaluator.id',
                          option.value,
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ flex: '1 1' }}>
                  {statementsToDisplay.map((statement) => (
                    <StatementCard
                      key={statement.id}
                      statement={statement}
                      onDeleted={() => {
                        refetch({ sourceId: parseInt(source.id, 10) });
                      }}
                    />
                  ))}
                  {statementsToDisplay.length === 0 && (
                    <p>Vybranému filtru nevyhovují žádné výroky</p>
                  )}
                </div>
              </div>
            </>
          );
        }}
      </GetSourceStatementsQueryComponent>
    );
  }
}

export default connect()(SourceDetail);