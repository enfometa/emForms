import { isNullOrUndefined, isObject, mergeDeep } from "./EmForms";

class EmFormsCore {
  formsGroup = null;
  model = null;
  allowAddProp = false;
  constructor(formsObject) {
    this.formsGroup = formsObject;
    this.setTouch(false);

    //default config
    this.config = {
      errorMessageTriggers: { touch: true, change: true },
    };

    //override config provided by user call
    if (!isNullOrUndefined(formsObject.config)) {
      mergeDeep(this.config, formsObject.config);
    }
  }

  setFormsObj(formsObj) {
    this.formsGroup = formsObj;
  }

  isValid = () => {
    let isValid = true;
    this.formsGroup.forms.map((form) => {
      if (form.validators != undefined) {
        form.validators.map((validator) => {
          if (this.isValidFormValidator(form.name, validator.name) === false) {
            isValid = false;
          }
        });
      }
    });
    return isValid;
  };

  isValidForm = (formName) => {
    let isValid = true;
    let form = this.getForm(formName);
    if (form !== undefined) {
      form.validators.map((validator) => {
        if (this.isValidFormValidator(form.name, validator.name) === false) {
          isValid = false;
        }
      });
    }
    return isValid;
  };

  isValidFormValidator = (formName, validatorName) => {
    let isValid = true;
    let form = this.getForm(formName);
    if (form !== undefined && form.validators !== undefined) {
      let validators = form.validators.filter((v) => v.name === validatorName);
      if (validators.length > 0) {
        let validator = validators[0];
        if (validator.func(form, this, validator.param) == false) {
          isValid = false;
        }
      }
    }
    return isValid;
  };

  getFormErrors = (formName) => {
    let errors = [];
    let form = this.getForm(formName);
    if (form !== undefined && form.validators !== undefined) {
      form.validators.map((validator) => {
        let isValid = this.isValidFormValidator(form.name, validator.name);
        if (!isValid) {
          errors.push({ validatorName: validator.name, message: validator.message });
        }
      });
    }
    return errors;
  };

  getFormError = (formName, validatorName) => {
    let errors = this.getFormErrors(formName);
    let validatorErrors = errors.filter((err) => err.validatorName == validatorName);
    return validatorErrors.length > 0 ? validatorErrors[0] : null;
  };

  getFormErrorMessage = (formName, validatorName) => {
    let formError = this.getFormError(formName, validatorName);
    return formError !== null ? formError.message : null;
  };

  getErrors = () => {
    let errors = [];
    this.formsGroup.forms.map((form) => {
      let formErrors = this.getFormErrors(form.name);
      errors = [...errors, ...formErrors];
    });
    return errors;
  };

  validate = () => {
    let isValid = this.isValid();
    this.setTouch(true);
    this.updateParentState();

    return isValid;
  };

  validateForm = (formName) => {
    let isValid = this.isValid(formName);
    this.setTouch(formName, true);
    this.updateParentState();

    return isValid;
  };

  showError = (formName, validator) => {
    let isValid = this.isValidFormValidator(formName, validator);
    let touched = this.getFormTouch(formName);

    let showMessage = false;
    if (!isValid && touched) {
      showMessage = true;
    }
    return showMessage;
  };

  resetForm = (formName, value) => {
    this.setFormValue(formName, value);
    this.setFormTouch(formName, false);
  };

  reset = (values, excludeValues) => {
    this.formsGroup.forms.map((form) => {
      let formName = form.formName;

      let exclude = false;
      if (excludeValues != undefined && excludeValues != null) {
        if (excludeValues.filter((ev) => ev.formName == formName).length > 0) {
          exclude = true;
        }
      }
      if (!exclude) {
        form.value = null;
        if (form.resetValue) {
          form.value = form.resetValue;
        }
        if (values != undefined && values != null) {
          let forms = values.filter((f) => f.formName == formName);
          if (forms.length > 0) {
            form.value = forms[0].value;
          }
        }
      }
    });
    this.setTouch(false);
    this.updateParentState();
  };

  setFormValue = (formName, value) => {
    if (value != null) {
      let strVal = value.toString();
      if (strVal.includes("/Date(")) {
        value = new Date(parseInt(strVal.substr(6)));
      }
    }
    let form = this.getForm(formName);
    if (form !== undefined && form !== null) {
      form.value = value;
      if (!isNullOrUndefined(this.model)) {
        if (this.model[formName] !== undefined || this.allowAddProp) {
          this.model[formName] = value;
        }
      }
    }
    this.updateParentState();
  };

  setFormTouch = (formName, touched) => {
    let form = this.getForm(formName);
    if (form !== null) {
      form.touched = touched;
    }
    this.updateParentState();
  };

  setFormMode = (formName, mode) => {
    let form = this.getForm(formName);
    if (form !== undefined) {
      form.mode = mode;
    }
  };

  setTouch = (touched) => {
    this.formsGroup.forms.map((form) => {
      this.setFormTouch(form.name, touched);
    });
  };

  setMode = (mode) => {
    this.formsGroup.forms.map((form) => {
      form.mode = mode;
    });
    this.updateParentState();
  };

  updateParentState = () => {
    if (this.formsGroup.handleStateUpdate != undefined) {
      this.formsGroup.handleStateUpdate();
    }
  };

  getForm = (formName) => {
    let form = this.formsGroup.forms.filter((form) => form.name === formName);
    if (form.length > 0) {
      return form[0];
    } else {
      return null;
    }
  };

  getFormValue = (formName) => {
    let form = this.getForm(formName);
    if (form !== null && form.value !== undefined) {
      return form.value;
    }
  };

  getFormMode = (formName) => {
    let form = this.getForm(formName);
    if (form !== null && form.mode !== undefined) {
      return form.mode;
    }
  };

  getFormTouch = (formName) => {
    let form = this.getForm(formName);
    let touched = false;
    if (form !== null && form.touched !== undefined) {
      touched = form.touched == true ? true : false;
    }

    return touched;
  };

  toModel = () => {
    let modelToUpdate = {};
    this.formsGroup.forms.map((item, index) => {
      modelToUpdate[item.name] = item.value;
    });
    return modelToUpdate;
  };

  setValuesFromModel = (obj, values) => {
    if (obj !== null) {
      Object.keys(obj).map((item) => {
        this.setFormValue(item, obj[item]);
      });
    }

    if (values !== undefined && values !== null) {
      values.map((value) => {
        let form = this.getForm(value.name);
        if (form !== null) {
          form.value = value.value;
        }
      });
    }
  };

  setModel = (model, allowAddProp = false) => {
    this.model = model;
    this.allowAddProp = allowAddProp;
    this.setValuesFromModel(model);
  };
}

export default EmFormsCore;
