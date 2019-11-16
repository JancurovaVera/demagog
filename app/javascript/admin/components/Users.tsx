/* eslint jsx-a11y/anchor-has-content: 0, jsx-a11y/anchor-is-valid: 0 */

import React, { useState } from 'react';

import { Button, Callout, Card, Classes, Colors, Switch, NonIdealState } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import { ApolloError } from 'apollo-client';
import * as classNames from 'classnames';
import { css } from 'emotion';
import { useQuery, useMutation } from 'react-apollo';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import { addFlashMessage } from '../actions/flashMessages';
import {
  GetUsers as GetUsersQuery,
  GetUsersVariables as GetUsersQueryVariables,
  UpdateUserActiveness,
  UpdateUserActivenessVariables,
} from '../operation-result-types';
import * as mutations from '../queries/mutations';
import { GetUsers } from '../queries/queries';
import { newlinesToBr } from '../utils';
import Authorize from './Authorize';
import { SearchInput } from './forms/controls/SearchInput';
import Loading from './Loading';
import SpeakerAvatar from './SpeakerAvatar';
import { Dispatch } from 'redux';

function useFlashMessages() {
  const dispatch = useDispatch();

  return {
    addSuccessFlashMessage(message: string) {
      dispatch(addFlashMessage(message, 'success'));
    },
    addErrorFlashMessage(message: string) {
      dispatch(addFlashMessage(message, 'error'));
    },
  };
}

function UsersContainer() {
  const dispatch = useDispatch();
  const flashes = useFlashMessages();
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const { data, loading, error } = useQuery<GetUsersQuery, GetUsersQueryVariables>(GetUsers, {
    variables: {
      name: search,
      includeInactive: includeInactive,
    },
  });
  const [mutate, { loading: saving }] = useMutation<
    UpdateUserActiveness,
    UpdateUserActivenessVariables
  >(mutations.UpdateUserActiveness);

  return (
    <Users
      dispatch={dispatch}
      search={search}
      loading={loading}
      saving={saving}
      users={data ? data.users : []}
      error={error}
      includeInactive={includeInactive}
      onSearchChange={setSearch}
      onIncludeInactiveChange={setIncludeInactive}
      onUpdateUserActiveness={async (userId: string, active: boolean) => {
        try {
          await mutate({ variables: { id: Number(userId), userActive: active } });

          flashes.addSuccessFlashMessage(
            `Uživatel úspěšně ${active ? 'aktivován' : 'deaktivován'}.`,
          );
        } catch (error) {
          flashes.addErrorFlashMessage(
            `Došlo k chybě při ${active ? 'deaktivaci' : 'aktivaci'} uživatele.`,
          );
        }
      }}
    />
  );
}

interface IProps {
  search: string;
  includeInactive: boolean;
  loading: boolean;
  saving: boolean;
  users: any[];
  error?: ApolloError;
  dispatch: Dispatch<any>;

  onSearchChange(search: string): void;
  onIncludeInactiveChange(includeInactive: boolean): void;
  onUpdateUserActiveness(userId: string, userActive: boolean): void;
}

interface IUsersState {
  confirmDeleteModalUserId: string | null;
}

class Users extends React.Component<IProps, IUsersState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      confirmDeleteModalUserId: null,
    };
  }

  private showConfirmDeleteModal = (confirmDeleteModalUserId: string) => () => {
    this.setState({ confirmDeleteModalUserId });
  };

  // private hideConfirmDeleteModal = () => {
  //   this.setState({ confirmDeleteModalUserId: null });
  // };

  // private onDeleted = () => {
  //   this.props.dispatch(addFlashMessage('Uživatel byl úspěšně smazán.', 'success'));

  //   this.hideConfirmDeleteModal();
  // };

  // private onDeleteError = (error: ApolloError) => {
  //   if (error.message.match(/cannot be deleted if it is already linked/)) {
  //     this.props.dispatch(
  //       addFlashMessage(
  //         'Uživatele nelze smazat, protože už byl v systému aktivní. Deaktivujte jej.',
  //         'warning',
  //       ),
  //     );
  //     return;
  //   }

  //   this.props.dispatch(addFlashMessage('Doško k chybě při mazání uživatele', 'error'));

  //   console.error(error); // tslint:disable-line:no-console
  // };

  // tslint:disable-next-line:member-ordering
  public render() {
    // const { confirmDeleteModalUserId } = this.state;

    // const deletedUser = props.data.users.find((s) => s.id === confirmDeleteModalUserId);
    // const refetchUsers = () =>
    //   props.refetch({
    //     name: this.props.search,
    //     includeInactive: this.props.includeInactive,
    //   });

    //         return (
    //           <div style={{ marginTop: 15 }}>
    //             {deletedUser && (
    //               <ConfirmDeleteModal
    //                 message={`Opravdu chcete smazat uživatele ${deletedUser.firstName} ${deletedUser.lastName}?`}
    //                 onCancel={this.hideConfirmDeleteModal}
    //                 mutation={DeleteUser}
    //                 mutationProps={{
    //                   variables: { id: confirmDeleteModalUserId },
    //                   refetchQueries: [
    //                     {
    //                       query: GetUsers,
    //                       variables: {
    //                         name: this.props.search,
    //                         includeInactive: this.props.includeInactive,
    //                       },
    //                     },
    //                   ],
    //                   onCompleted: this.onDeleted,
    //                   onError: this.onDeleteError,
    //                 }}
    //               />
    //             )}

    //             {props.data.users.length === 0 && this.props.search !== '' && (
    //               <p>Nenašli jsme žádného člena týmu se jménem „{this.props.search}“.</p>
    //             )}
    //           </div>

    return (
      <div style={{ padding: '15px 0 40px 0' }}>
        <Authorize permissions={['users:edit']}>
          <div style={{ float: 'right' }}>
            <Link className={Classes.BUTTON} to="/admin/users/sort-on-about-us-page" role="button">
              Seřadit na stránce „O nás“
            </Link>
            <Link
              data-test-id="create-user-btn"
              className={classNames(
                Classes.BUTTON,
                Classes.INTENT_PRIMARY,
                Classes.iconClass(IconNames.PLUS),
                css`
                  margin-left: 7px;
                `,
              )}
              to="/admin/users/new"
              role="button"
            >
              Přidat nového člena týmu
            </Link>
          </div>
        </Authorize>

        <h2 className={Classes.HEADING}>Tým</h2>

        <div style={{ marginTop: 15 }}>
          <Switch
            data-test-id="toggle-deactive-users-btn"
            checked={this.props.includeInactive}
            label="Zobrazit i deaktivované členy"
            onChange={(e) => this.props.onIncludeInactiveChange(e.currentTarget.checked)}
          />
          <SearchInput
            placeholder="Hledat dle jména…"
            value={this.props.search}
            onChange={this.props.onSearchChange}
          />
        </div>

        {this.props.loading ? (
          <Loading />
        ) : this.props.error ? (
          <NonIdealState title="Chyba" description="Doslo k chybe pri nacitani uzivatelu" />
        ) : (
          this.props.users.map((user) => (
            <Card
              data-test-id="user-card"
              key={user.id}
              style={{
                marginBottom: 15,
                backgroundColor: user.active ? 'none' : Colors.LIGHT_GRAY4,
              }}
            >
              <div style={{ display: 'flex' }}>
                <div style={{ flex: '0 0 106px' }}>
                  <SpeakerAvatar
                    avatar={user.avatar}
                    first_name={user.firstName || ''}
                    last_name={user.lastName || ''}
                  />
                </div>
                <div style={{ flex: '1 1', marginLeft: 15 }}>
                  <Authorize permissions={['users:edit']}>
                    <div
                      style={{
                        float: 'right',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <Link
                        to={`/admin/users/edit/${user.id}`}
                        className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.EDIT))}
                      >
                        Upravit
                      </Link>
                      {user.active ? (
                        <Button
                          data-test-id="deactivate-user-btn"
                          icon={IconNames.CROSS}
                          style={{ marginLeft: 7 }}
                          text="Deaktivovat"
                          disabled={this.props.saving}
                          onClick={() => this.props.onUpdateUserActiveness(user.id, false)}
                        />
                      ) : (
                        <Button
                          data-test-id="activate-user-btn"
                          icon={IconNames.TICK}
                          style={{ marginLeft: 7 }}
                          text="Aktivovat"
                          disabled={this.props.saving}
                          onClick={() => this.props.onUpdateUserActiveness(user.id, true)}
                        />
                      )}
                      <Button
                        type="button"
                        icon={IconNames.TRASH}
                        style={{ marginLeft: 7 }}
                        onClick={this.showConfirmDeleteModal(user.id)}
                        title="Smazat"
                      />
                    </div>
                  </Authorize>

                  <h5 className={Classes.HEADING}>
                    {user.firstName} {user.lastName}
                  </h5>

                  <h6 className={Classes.HEADING}>{user.positionDescription}</h6>
                  <p>{user.bio && newlinesToBr(user.bio)}</p>

                  <Callout>
                    <span className={Classes.TEXT_MUTED}>Email: </span>
                    {user.email}
                    <br />
                    <span className={Classes.TEXT_MUTED}>Přístupová práva: </span>
                    {user.role.name}
                    <br />
                    <span className={Classes.TEXT_MUTED}>Posílat upozornění emailem: </span>
                    {user.emailNotifications ? 'Ano' : 'Ne'}
                    <br />
                    <span className={Classes.TEXT_MUTED}>Zobrazit v O nás:&nbsp;</span>
                    {user.userPublic ? 'Ano' : 'Ne'}
                  </Callout>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    );
  }
}

export default UsersContainer;
