import { useDispatch } from 'react-redux';
import { addFlashMessage } from '../actions/flashMessages';

export function useFlashMessages() {
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
