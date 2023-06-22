// config
const config = {};

// helper container
const helpers = {};

config.baseUrl = "http://localhost:3000";

//  query selector helpers
const _ = (elem) => document.querySelector(elem);

/**
 * Validating input
 *
 * @param {*} str - type string
 * @returns `boolean` | `string`
 */
function validate(str, min = 3, max = 40, exact = 0) {
  min = typeof min === "undefined" || !min ? 3 : min;
  max = typeof max === "undefined" || !max ? 40 : max;

  // exact is used to validate the str of exact length;
  if (exact)
    return typeof str === "string" && str.trim().length === exact ? str : false;

  return typeof str === "string" &&
    str.trim().length >= min &&
    str.trim().length <= max
    ? str
    : false;
}

/**
 * Used to get form values
 * @param {string} formName - Name for the form
 * @param {string} inputName - name for input
 * @param {boolean} isCheckbox - whether is a checkboz input
 * @returns `form value`
 */
helpers.getFormValue = (formName, inputName, isCheckbox = false) => {
  formName = typeof formName !== "string" ? "" : formName;
  inputName = typeof inputName !== "string" ? "" : inputName;
  isCheckbox = typeof isCheckbox === "boolean" ? isCheckbox : false;

  if (isCheckbox) return document.forms[formName][inputName].checked;

  return document.forms[formName][inputName].value;
};

helpers.inputErrorMsg = (inputName, msg) => `${inputName} ${msg}`;

/**
 * Used to display errors,
 *
 * When `disappear` is set i.e milliseconds e.g 2000, the error msg will disappear after 2000s have elapsed
 * @param {string} elem - Element Name
 * @param {string} msg  - Error Msg
 * @param {number} disappear - milliseconds delay
 */
helpers.displayErrors = (elem, msg, disappear = 0) => {
  // show the parent of the elem
  _(elem).parentElement.style.display = "block";

  // set TextNode
  _(elem).innerHTML = msg;

  // if disappear is > 0
  // then wait util the sec(s) elapsed
  // remove the msg
  if (disappear > 0) {
    const id = setTimeout(() => {
      _(elem).innerHTML = "";
      _(elem).parentElement.style.display = "none";
      clearTimeout(id);
    }, disappear);
  }
};

/**
 * Used to Attach onsubmit handler to `form` with `formName`
 * @param {string} formName - Name of the form
 * @param {function} submitHandler - submit handler
 *
 */
helpers.formLookUpAndAttachSubmit = (formName, submitHandler) => {
  formName = validate(formName);

  if (!formName) throw new Error("Cannot not attach a handler to such form");

  if (document.forms[formName])
    document.forms[formName].addEventListener("submit", submitHandler);
};

/**
 * Used to display form errors
 * @param {object} errors
 * @param {string} formName
 */

helpers.displayFormErrorMsgs = (errors, formName) => {
  const inputs = _(`form[name=${formName}]`).getElementsByTagName("input");

  for (let input of inputs) {
    input.nextElementSibling.innerHTML = errors[input.name]
      ? errors[input.name]
      : "";
  }
};

/**
 *
 * @param {string} formName - Name of the given form
 * @param {object} schema - Should have the input names as keys e.g <<input />input name="`inputName`" ... /> `schema = { inputName: {msg: "Error msg for this input"} }`
 *
 * The schema keys should be typeof `object`  with keys like `{msg:"", type:"boolean | number", length: "length of the sting value"  }`
 *
 * @returns `{data: {}, errors: {}}`
 */
helpers.validateForm = (formName, schema) => {
  // This method is specific to this form
  const inputValue = (inputName, isCheckbox = false) =>
    helpers.getFormValue(formName, inputName, isCheckbox);

  let data = {};
  const errors = {};

  for (let label in schema) {
    let value;

    if (schema[label].type === "boolean") value = inputValue(label, true);
    else if (schema[label].type === "number")
      value = validate(inputValue(label), null, null, schema[label].length);
    else value = validate(inputValue(label));

    if (!value) errors[label] = helpers.inputErrorMsg(label, schema[label].msg);
    else data[label] = value;
  }

  return {
    errors,
    data,
  };
};

/**
 * Used to make http requests
 * @param {string} url - URL e.g `http(s)://example.com/path?q=go`
 * @param {string} method - `[GET | PUT | DELETE | POST]`
 * @param {object} data
 * @param {object} headers
 * @returns
 */
helpers.useFetch = async (url, method = "GET", data = {}, headers = {}) => {
  let resp, result, errors;

  try {
    if (method === "GET" || method === "DELETE") resp = await fetch(url);
    else
      resp = await fetch(url, {
        body: JSON.stringify(data),
        method,
        headers,
      });

    if (resp.status >= 400 && resp.status <= 500) errors = await resp.json();
    else result = await resp.json();

    console.log(resp.status);
  } catch (ex) {
    console.log("HERER ", ex);
    errors = { ...errors, ex };
  }

  return {
    result,
    errors,
  };
};

// submitting the form
const createAccSubmit = async (e) => {
  e.preventDefault();

  const formName = "createAcc";
  const msg = "a must at least have 3 to 40 char(s)";
  const schema = {
    firstName: { msg },
    lastName: { msg },
    password: { msg },
    phone: { msg: "must have 10 digits", type: "number", length: 10 },
    agreement: { msg: "must be checked", type: "boolean" },
  };

  const { errors, data } = helpers.validateForm(formName, schema);

  // clearing all errors on validate inputs.
  helpers.displayFormErrorMsgs(errors, formName);

  if (Object.keys(errors).length !== 0) {
    helpers.displayFormErrorMsgs(errors, formName);
    return;
  }

  // send the data to the backend
  let tosAgreement = data.agreement;
  delete data.agreement;

  const { errors: _errors } = await helpers.useFetch(
    `${config.baseUrl}/api/users`,
    "POST",
    {
      ...data,
      tosAgreement,
    }
  );

  if (errors) {
    helpers.displayErrors(".errorMsg > p", _errors.error, 7000);

    return;
  }

  console.log(`Data: `, data);

  //   everything is okay here
  //@TODO - redirect the user to dashboard
};

helpers.formLookUpAndAttachSubmit("createAcc", createAccSubmit);
