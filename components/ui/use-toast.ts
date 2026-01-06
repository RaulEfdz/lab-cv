import * as React from "react"

import type { ToastProps } from "./toast"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 5000

type ToastsMap = Map<
  ToastProps["id"],
  {
    toast: ToastProps
    timeout: ReturnType<typeof setTimeout> | undefined
  }
>

type State = {
  toasts: ToastProps[]
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

type Action =
  | {
      type: typeof actionTypes.ADD_TOAST
      toast: ToastProps
    }
  | {
      type: typeof actionTypes.UPDATE_TOAST
      toast: ToastProps
    }
  | {
      type: typeof actionTypes.DISMISS_TOAST
      toastId?: ToastProps["id"]
    }
  | {
      type: typeof actionTypes.REMOVE_TOAST
      toastId?: ToastProps["id"]
    }

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // ! Side effects !
      if (toastId) {
        toastsMap.get(toastId)?.timeout &&
          clearTimeout(toastsMap.get(toastId)!.timeout as NodeJS.Timeout)
      } else {
        toastsMap.forEach((entry) => {
          entry.timeout && clearTimeout(entry.timeout as NodeJS.Timeout)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    default:
      return state
  }
}

const toastsMap = new Map<
  ToastProps["id"],
  {
    toast: ToastProps
    timeout: ReturnType<typeof setTimeout> | undefined
  }
>()

type Toast = Omit<ToastProps, "id"> & {
  id: string
}

function genId() {
  return Math.random().toString(36).substring(2, 9)
}

function createToastFunction(
  dispatch: React.Dispatch<Action>,
  opts?: ToastProps
) {
  const toast = ({ ...props }: ToastProps) => {
    const id = genId()

    const update = (props: ToastProps) =>
      dispatch({
        type: actionTypes.UPDATE_TOAST,
        toast: { ...props, id },
      })
    const dismiss = () =>
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

    dispatch({
      type: actionTypes.ADD_TOAST,
      toast: {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss()
        },
      },
    })

    return {
      id: id,
      dismiss,
      update,
    }
  }

  return toast
}

type ToastFunction = ReturnType<typeof createToastFunction>

function useToast() {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] })
  const addToastRef = React.useRef<ToastFunction | null>(null)

  addToastRef.current = addToastRef.current || createToastFunction(dispatch)

  const addToast = React.useCallback<ToastFunction>(
    (props) => {
      if (addToastRef.current) {
        return addToastRef.current(props)
      }
      return { id: "", dismiss: () => {}, update: () => {} }
    },
    [addToastRef]
  )

  React.useEffect(() => {
    state.toasts.forEach((toast) => {
      if (toast.open) {
        const timeout = setTimeout(() => {
          dispatch({ type: actionTypes.DISMISS_TOAST, toastId: toast.id })
        }, TOAST_REMOVE_DELAY)

        toastsMap.set(toast.id, { toast, timeout })
      } else {
        const entry = toastsMap.get(toast.id)
        if (entry) {
          clearTimeout(entry.timeout as NodeJS.Timeout)
          dispatch({ type: actionTypes.REMOVE_TOAST, toastId: toast.id })
          toastsMap.delete(toast.id)
        }
      }
    })
  }, [state.toasts])

  return {
    toasts: state.toasts,
    toast: addToast,
    dismiss: (toastId?: ToastProps["id"]) =>
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  }
}

export { useToast, reducer, actionTypes }