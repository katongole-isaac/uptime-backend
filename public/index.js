// config
const config = {};

// helper container
const helpers = {};

config.baseUrl = "http://localhost:3000";
config.tokensApiEndpoint = `${config.baseUrl}/api/tokens`;
config.usersApiEndpoint = `${config.baseUrl}/api/users`;

//  query selector helpers
const _ = (elem) => document.querySelector(elem);

/**
 * Sets or stores the `auth-token` in the `localstorage`
 * @param {object} token
 */
helpers.setAuthToken = (token) => {
  token = typeof token === "object" ? token : false;

  if (!token) return;

  localStorage.setItem("auth-token", JSON.stringify(token));
};

/**
 * Returns the stored `auth-token` otherwise false
 * @returns `token object | false`
 */
helpers.getAuthToken = () => {
  const token = localStorage.getItem("auth-token");

  return !token ? false : JSON.parse(token);
};

/**
 * Removes the `token` from localStorage
 */
helpers.unSetAuthToken = () => {
  localStorage.removeItem("auth-token");
};

/**
 * Logs out the current user
 * @returns `void`
 */
helpers.logout = async () => {
  const token = helpers.getAuthToken();

  if (!token) return;

  const url = `${config.tokensApiEndpoint}/?id=${token.id}`;

  const { statusCode, errors } = await helpers.useFetch(url, "DELETE");

  if (!(statusCode && statusCode === 200)) {
    console.log("Logging Logout error", errors, statusCode);
  }

  // you can log the user out
  // remove the token
  helpers.unSetAuthToken();

  // redirect to logout page
  window.location = "/account/logout";
};

/**
 * Checks if the user is already logged in and redirects to dashboard
 *
 */
helpers.checkIfLoggedInAndRedirect = () => {
  const loginPath = "/account/login";
  const createAccountPath = "/account/create";

  const pathname = window.location.pathname;

  if (pathname === loginPath || pathname === createAccountPath)
    if (helpers.getAuthToken())
      // check if the user has already loggedin
      window.location.replace("/checks/all");
};

/**
 * Renewal the stored token
 * @returns `void`
 */
helpers.tokenRenewal = async () => {
  console.log("HERe");
  const token = helpers.getAuthToken();

  if (!token && typeof token !== "object")
    return console.error(
      "Invalid token stored. You need to login in order to get a valid token "
    );

  const payload = {
    extend: true,
    id: token.id,
  };

  const { errors, result: respToken } = await helpers.useFetch(
    config.tokensApiEndpoint,
    "PUT",
    payload
  );

  if (!(Object.keys(errors).length > 0)) {
    // store the return respToken
    helpers.setAuthToken(respToken);
    console.log(`Token Renewed successfully ...`);
    return;
  }

  // you need
  //@TODO - you need to figure out something to do here
  // once the token renewal fails
  console.error("Token Renewal Error", errors);
};

/**
 * Runs the tokenRenewal function every 5 minutes
 */
helpers.tokenRenewalLoop = () => {
  setInterval(async () => {
    await helpers.tokenRenewal();
  }, 1000);
};

/**
 * It shows the nav links accordingly i.e if `loggedIn` don't show signup and login
 * @param {string} navSelector
 * @returns `void`
 */
helpers.addNavClasses = (navSelector) => {
  const nav = _(navSelector).getElementsByTagName("a");

  if (!nav) return;

  for (let item of nav) {
    const linkLabel = item.innerHTML.toLowerCase();
    if (linkLabel === "home") continue;

    if (linkLabel === "signup" || linkLabel === "login") {
      if (!helpers.getAuthToken())
        item.parentElement.classList.add("loggedOut");
      else item.parentElement.classList.remove("loggedOut");

      //don't go down
      // move to the next iteration
      continue;
    }

    if (helpers.getAuthToken()) item.parentElement.classList.add("loggedIn");
    else item.parentElement.classList.remove("loggedIn");
  }
};

/**
 * Add `addEventListener` to an element
 * @param {string} eventType - event to listen to
 * @param {*} elemSelector - selector used to get the element
 * @param {*} handler - eventListener
 * @returns
 */
helpers.bindHandler = (eventType, elemSelector, handler) => {
  elemSelector =
    typeof elemSelector === "string" && elemSelector.trim().length > 0
      ? elemSelector
      : false;
  eventType =
    typeof eventType === "string" && eventType.trim().length > 0
      ? eventType
      : false;

  if (!(elemSelector && eventType)) return;

  _(elemSelector).addEventListener(eventType, handler);
};

/**
 * Validate strings - checks if the `str` is of length greater than `0`
 * @param {*} str
 * @returns string | false
 */
helpers.strValidate = (str) =>
  typeof str === "string" && str.trim().length > 0 ? str : false;

/**
 * Used to determine is an object has keys or not
 * @param {object} value object to be checked
 * @returns boolean
 */

helpers.hasKeys = (value) => {
  value = typeof value === "object" ? value : {};

  return Object.keys(value).length > 0 ? true : false;
};

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
 * @param {boolean} isCheckbox - whether is a checkbox input
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
helpers.displayAlert = (elem, msg, disappear = 0) => {
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
helpers.bindFormSubmit = (formName, submitHandler) => {
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
 * - The schema keys should be typeof `object`  with keys like `{msg:"", type:"boolean | number", length: "length of the sting value"  }`
 *
 * - The kind field on the schema specific the kind of form field being given
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
    else if (schema[label].hasOwnProperty("kind"))
      value = inputValue(label) ? inputValue(label) : false;
    else value = validate(inputValue(label)) ? inputValue(label) : false;

    if (!value) errors[label] = helpers.inputErrorMsg(label, schema[label].msg);
    else data[label] = value;
  }

  return {
    errors,
    data,
  };
};

/**
 * Used to set the value for a form input
 * @param {string} formName Name of the form
 * @param {string} inputName input name
 * @param {string} value input value
 * @returns undefined | string
 */
helpers.setFormValue = (formName, inputName, value) => {
  formName = helpers.strValidate(formName);
  inputName = helpers.strValidate(inputName);
  value = helpers.strValidate(value);

  if (!(formName && inputName && value)) return;

  if (!document.forms[formName] || !document.forms[formName][inputName]) return;

  return (document.forms[formName][inputName].value = value);
};

/**
 * Used to make http requests
 * @param {string} url - URL e.g `http(s)://example.com/path?q=go`
 * @param {string} method - `[GET | PUT | DELETE | POST]`
 * @param {object} data - Payload
 * @param {object} headers - headers
 * @param {boolean} auth - flag used to determine whether or not to add `token` to headers
 * @returns
 */
helpers.useFetch = async (
  url,
  method = "GET",
  data = {},
  headers = {},
  auth = false
) => {
  let resp, result, errors, statusCode;

  method = typeof method === "undefined" || !method ? "GET" : method;

  if (auth)
    headers = {
      ...headers,
      "x-auth-token": helpers.getAuthToken().id,
    };

  try {
    if (method === "GET" || method === "DELETE")
      resp = await fetch(url, { headers });
    else
      resp = await fetch(url, {
        body: JSON.stringify(data),
        method,
        headers,
      });

    statusCode = resp.status;

    if (resp.status >= 400 && resp.status <= 500)
      errors = { ...errors, ...(await resp.json()) };
    else result = await resp.json();
  } catch (ex) {
    console.log("HERER ", ex);
    errors = { ...errors, ex };
  }

  return {
    result,
    errors,
    statusCode,
  };
};

/**
 * Fetches current user details
 * @returns `{errors, data}`
 */
helpers.getUserDetails = async () => {
  let data, errors;
  const token = helpers.getAuthToken();

  if (!token) return;

  const url = `${config.usersApiEndpoint}/?phone=${token.phone}`;

  const { errors: _errors, result } = await helpers.useFetch(
    url,
    "GET",
    {},
    {},
    true
  );

  errors = { ..._errors };

  return {
    errors,
    data: result,
  };
};

/**
 * Used to populate my_details form on `Account Settings Page`
 * @returns `void`
 */
helpers.populateMyDetailsForm = async () => {
  // runs this function only if the user is logged in
  if (!helpers.getAuthToken()) return;

  const { errors, data } = await helpers.getUserDetails();

  if (Object.keys(errors).length > 0) {
    helpers.displayAlert(".errorMsg > p", errors.error, 5000);

    return;
  }

  for (let key in data) {
    helpers.setFormValue("my_details", key, data[key]);
  }
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
    config.usersApiEndpoint,
    "POST",
    {
      ...data,
      tosAgreement,
    }
  );

  if (_errors) {
    helpers.displayAlert(".errorMsg > p", _errors.error, 7000);

    return;
  }

  // account created successfully here
  //now do login
  const { errors: loginErrors, result: token } = await helpers.useFetch(
    config.tokensApiEndpoint,
    "POST",
    {
      phone: data.phone,
      password: data.password,
    }
  );

  if (loginErrors) {
    console.log(`Login Errors on Account Creation: `, loginErrors);
    return;
  }

  // store the token and do redirection
  helpers.setAuthToken(token);

  window.location = "/checks/all";
};

// Login form handling and submission.

const LoginForm = async (e) => {
  e.preventDefault();
  const formName = "loginForm";
  const schema = {
    phone: { msg: "must have 10 digits", type: "number", length: 10 },
    password: { msg: "should not be empty", kind: "login" },
  };

  const { errors, data } = helpers.validateForm(formName, schema);

  if (Object.keys(errors).length !== 0) {
    helpers.displayFormErrorMsgs(errors, formName);
    console.log("Errors", errors);
    return;
  }

  // clear errors on successful validation
  helpers.displayFormErrorMsgs(errors, formName);

  // submit to login
  const { errors: _errors, result: token } = await helpers.useFetch(
    config.tokensApiEndpoint,
    "POST",
    data
  );

  if (_errors) {
    helpers.displayAlert(".errorMsg > p", _errors.error, 7000);
    console.log(_errors);
    return;
  }

  // store the token return and
  // redirect to the dashboard
  helpers.setAuthToken(token);

  window.location.replace("/checks/all");
};

// Account Setting My details form
const accountMyDetails = async (e) => {
  e.preventDefault();
  const msg = "a must at least have 3 to 40 char(s)";
  const schema = {
    firstName: { msg },
    lastName: { msg },
  };
  const formName = "my_details";

  const { data, errors } = helpers.validateForm(formName, schema);

  // clearing all errors on validate inputs.
  helpers.displayFormErrorMsgs(errors, formName);

  if (helpers.hasKeys(errors)) {
    helpers.displayFormErrorMsgs(errors, formName);

    return;
  }

  // submit for updates here

  // get phone number
  const phone = validate(
    helpers.getFormValue(formName, "phone"),
    null,
    null,
    10
  );

  if (!phone) {
    helpers.displayAlert(
      ".errorMsg > p",
      "Need a valid phone number to save the updates",
      5000
    );

    return;
  }

  // here u can update the data

  const payload = { ...data, phone };

  const { errors: _errors } = await helpers.useFetch(
    config.usersApiEndpoint,
    "PUT",
    payload,
    {},
    true
  );

  // display error returned from the request above
  if (helpers.hasKeys(_errors)) {
    helpers.displayAlert(".errorMsg > p", _errors.error, 5000);

    return;
  }

  // successfully updates
  helpers.displayAlert(".alert-success > p", "Successfully Updated", 5000);
};

// Change Password handler
const changePassword = async (e) => {
  e.preventDefault();

  const formName = "change_password";
  const msg = "a must at least have 3 to 40 char(s)";

  const schema = {
    password: { msg },
  };

  const { data, errors } = helpers.validateForm(formName, schema);

  // clearing all errors on validate inputs.
  helpers.displayFormErrorMsgs(errors, formName);

  if (helpers.hasKeys(errors)) {
    helpers.displayFormErrorMsgs(errors, formName);

    return;
  }

  const phone = validate(
    helpers.getFormValue("my_details", "phone"),
    null,
    null,
    10
  );

  if (!phone) {
    helpers.displayAlert(
      " .change_passwd_card  .errorMsg > p",
      "Need a valid phone number to save the updates",
      5000
    );

    return;
  }

  const { errors: _errors } = await helpers.useFetch(
    config.usersApiEndpoint,
    "PUT",
    { password: data.password, phone },
    {},
    true
  );

  // display error returned from the request above
  if (helpers.hasKeys(_errors)) {
    helpers.displayAlert(
      ".change_passwd_card .errorMsg > p",
      _errors.error,
      5000
    );

    return;
  }

  // successfully updates
  helpers.displayAlert(
    " .change_passwd_card  .alert-success  > p",
    "Successfully Updated",
    5000
  );
};

// Account delete handler
const accountDelete =  async(e) => {
  e.preventDefault();

  const formName = "account_deletion";
  const msg = "should not be empty";

  const schema = {
    password: { msg , kind: "accountDelete" },
  };

  const { errors, data } = helpers.validateForm(formName, schema);

  // clearing all errors on validate inputs.
  helpers.displayFormErrorMsgs(errors, formName);

  if (helpers.hasKeys(errors)) {
    helpers.displayFormErrorMsgs(errors, formName);

    return;
  }

   const phone = validate(
     helpers.getFormValue("my_details", "phone"),
     null,
     null,
     10
   );

   if (!phone) {
     helpers.displayAlert(
       " .account_delete .errorMsg > p",
       "Need a valid phone number to save the updates",
       5000
     );

     return;
   }

  // you need to verify the password
// verifying if password match
  const { errors: _errors, result: token } = await helpers.useFetch(
    config.tokensApiEndpoint,
    "POST",
    { phone , password : data.password }
  );

  if (_errors) {
    helpers.displayAlert(
      ".account_delete  .errorMsg > p",
      "password do not match",
      7000
    );
    console.log(_errors);
    return;
  }

  // here  the password  matches with the given password
  // so go ahead a delete the user.

  


  console.log(token);


 
};

/**
 * Holds the `init` function that in which start the app on client
 */
const app = {};

/**
 * Wrappers all the app called utilities & functions
 */
app.init = function () {
  helpers.bindFormSubmit("loginForm", LoginForm);

  helpers.bindFormSubmit("createAcc", createAccSubmit);

  helpers.bindFormSubmit("my_details", accountMyDetails);

  helpers.bindFormSubmit("change_password", changePassword);

  helpers.bindFormSubmit("account_deletion", accountDelete);
  helpers.populateMyDetailsForm();

  //used on nav links
  helpers.addNavClasses(".nav-links");

  // binding to logout btn;
  helpers.bindHandler("click", "#logout", (e) => {
    e.preventDefault();
    // logout
    helpers.logout();
  });
};

window.onload = function () {
  app.init();
};