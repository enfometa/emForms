import React, {useContext} from 'react';
import {isNullOrUndefined} from 'common/utilities';
import {FormGroupContext} from './EmForms';

function EmForm(props) {
  const {
    children,
    emForms,
    formName,
    validator,
    bindValue = true,
    valuePropName = 'value',
    onChangePropName = 'onChange',
    valueFunc = e => {
      return e;
    },
    ...rest
  } = props;
  const [firstChild, ...others] = Array.isArray(children) ? children : [children];

  const formGroupContext = useContext(FormGroupContext);
  let emFormsObj = null;
  if (!isNullOrUndefined(emForms)) {
    emFormsObj = emForms;
  } else {
    if (!isNullOrUndefined(formGroupContext)) {
      emFormsObj = formGroupContext.emForms;
    }
  }

  const onChangeCallback = e => {
    if (!isNullOrUndefined(emFormsObj)) {
      emFormsObj.setFormValue(formName, valueFunc(e));
      if (emFormsObj.config.errorMessageTriggers.change) {
        emFormsObj.setFormTouch(formName, true);
      }
    }
    if (!isNullOrUndefined(firstChild.props.onChange)) {
      firstChild.props.onChange(e);
    }
  };

  const onBlurCallback = e => {
    if (!isNullOrUndefined(emFormsObj)) {
      if (emFormsObj.config.errorMessageTriggers.touch) {
        emFormsObj.setFormTouch(formName, true);
      }
    }
    if (!isNullOrUndefined(firstChild.props.onBlur)) {
      firstChild.props.onBlur(e);
    }
  };

  let newProps = {[onChangePropName]: e => onChangeCallback(e), onBlur: e => onBlurCallback(e)};
  if (bindValue) {
    newProps[valuePropName] = emFormsObj.getFormValue(formName);
  }

  return (
    <React.Fragment>
      {!isNullOrUndefined(firstChild) && React.cloneElement(firstChild, newProps)}
      {others}
    </React.Fragment>
  );
}

export default EmForm;
