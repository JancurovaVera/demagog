import * as React from 'react';
import { Mutation, Query, MutationFunction } from 'react-apollo';
import { connect, DispatchProp } from 'react-redux';
import { RouteComponentProps } from 'react-router';

import { addFlashMessage } from '../actions/flashMessages';
import { deleteBodyLogo, uploadBodyLogo } from '../api';
import {
  GetBody as GetBodyQuery,
  GetBodyVariables as GetBodyQueryVariables,
  UpdateBody as UpdateBodyMutation,
  UpdateBodyVariables as UpdateBodyMutationVariables,
} from '../operation-result-types';
import { UpdateBody } from '../queries/mutations';
import { GetBodies, GetBody, GetSpeakerBodies } from '../queries/queries';
import Error from './Error';
import { BodyForm, IBodyFormData } from './forms/BodyForm';
import Loading from './Loading';

interface IUpdateBodyMutationFn
  extends MutationFunction<UpdateBodyMutation, UpdateBodyMutationVariables> {}

interface IBodyDetailProps extends RouteComponentProps<{ id: string }>, DispatchProp {}

class BodyEdit extends React.Component<IBodyDetailProps> {
  public onFormSubmit = (
    id: number,
    updateBody: IUpdateBodyMutationFn,
    previousData: GetBodyQuery,
  ) => (speakerFormData: IBodyFormData) => {
    const { logo, ...bodyInput } = speakerFormData;

    // We want to first update the logo and then run mutation so the logo
    // gets automatically refreshed in Apollo's cache from the mutation result data
    let logoPromise: Promise<any> = Promise.resolve();
    if (logo instanceof File) {
      logoPromise = uploadBodyLogo(id, logo);
    } else if (logo === null && previousData.body.logo !== null) {
      logoPromise = deleteBodyLogo(id);
    }

    return logoPromise
      .then(() => updateBody({ variables: { id, bodyInput } }))
      .then(() => {
        this.onCompleted();
      })
      .catch((error) => {
        this.onError(error);
      });
  };

  public onCompleted = () => {
    this.props.dispatch(addFlashMessage('Uložení proběhlo v pořádku', 'success'));
  };

  public onError = (error: any) => {
    this.props.dispatch(addFlashMessage('Doško k chybě při uložení dat', 'error'));

    console.error(error); // tslint:disable-line:no-console
  };

  public render() {
    const id = parseInt(this.props.match.params.id, 10);

    return (
      <div style={{ padding: '15px 0 40px 0' }}>
        <Query<GetBodyQuery, GetBodyQueryVariables> query={GetBody} variables={{ id }}>
          {({ data, loading, error }) => {
            if (loading || !data) {
              return <Loading />;
            }

            if (error) {
              return <Error error={error} />;
            }

            return (
              <Mutation<UpdateBodyMutation, UpdateBodyMutationVariables>
                mutation={UpdateBody}
                refetchQueries={[
                  { query: GetSpeakerBodies },
                  { query: GetBodies, variables: { name: '' } },
                ]}
              >
                {(updateBody) => (
                  <BodyForm
                    body={data.body}
                    onSubmit={this.onFormSubmit(id, updateBody, data)}
                    title="Upravit stranu / skupinu"
                  />
                )}
              </Mutation>
            );
          }}
        </Query>
      </div>
    );
  }
}

export default connect()(BodyEdit);
