import type { ShippingAddress } from '../types';

export interface CheckoutModalState {
  step: 1 | 2;
  formData: ShippingAddress;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

export type CheckoutModalAction =
  | { type: 'reset' }
  | { type: 'set-step'; step: 1 | 2 }
  | { type: 'set-field'; field: keyof ShippingAddress; value: string }
  | { type: 'set-form-data'; formData: ShippingAddress }
  | { type: 'set-errors'; errors: Record<string, string> }
  | { type: 'set-submitting'; isSubmitting: boolean };

export const createInitialCheckoutModalState = (): CheckoutModalState => ({
  step: 1,
  formData: {
    fullName: '',
    phone: '',
    email: '',
    pinCode: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Karnataka',
  },
  errors: {},
  isSubmitting: false,
});

export const checkoutModalReducer = (
  state: CheckoutModalState,
  action: CheckoutModalAction,
): CheckoutModalState => {
  switch (action.type) {
    case 'reset':
      return createInitialCheckoutModalState();
    case 'set-step':
      return { ...state, step: action.step };
    case 'set-field':
      return { ...state, formData: { ...state.formData, [action.field]: action.value } };
    case 'set-form-data':
      return { ...state, formData: action.formData, errors: {} };
    case 'set-errors':
      return { ...state, errors: action.errors };
    case 'set-submitting':
      return { ...state, isSubmitting: action.isSubmitting };
  }
};

export interface CheckoutOperationEpoch {
  current: number;
}

export const beginCheckoutOperation = (epoch: CheckoutOperationEpoch): number => ++epoch.current;
export const invalidateCheckoutOperation = (epoch: CheckoutOperationEpoch): void => { epoch.current++; };
export const isCurrentCheckoutOperation = (epoch: CheckoutOperationEpoch, operation: number): boolean =>
  epoch.current === operation;
