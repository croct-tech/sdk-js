'use strict';
var equal = require('ajv/lib/compile/equal');
var validate = (function() {
  var refVal = [];
  return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
    'use strict'; /*# sourceURL=https://schema.croct.io/web/user-signed-up.json */
    var vErrors = null;
    var errors = 0;
    if ((data && typeof data === "object" && !Array.isArray(data))) {
      if (true) {
        var errs__0 = errors;
        var valid1 = true;
        if (data.token === undefined) {
          valid1 = false;
          validate.errors = [{
            keyword: 'required',
            dataPath: (dataPath || '') + "",
            schemaPath: '#/required',
            params: {
              missingProperty: 'token'
            },
            message: 'should have required property \'token\''
          }];
          return false;
        } else {
          var errs_1 = errors;
          if (typeof data.token !== "string") {
            validate.errors = [{
              keyword: 'type',
              dataPath: (dataPath || '') + '/token',
              schemaPath: '#/properties/token/type',
              params: {
                type: 'string'
              },
              message: 'should be string'
            }];
            return false;
          }
          var valid1 = errors === errs_1;
        }
        if (valid1) {
          if (data.firstName === undefined) {
            valid1 = true;
          } else {
            var errs_1 = errors;
            if (typeof data.firstName !== "string") {
              validate.errors = [{
                keyword: 'type',
                dataPath: (dataPath || '') + '/firstName',
                schemaPath: '#/properties/firstName/type',
                params: {
                  type: 'string'
                },
                message: 'should be string'
              }];
              return false;
            }
            var valid1 = errors === errs_1;
          }
          if (valid1) {
            if (data.lastName === undefined) {
              valid1 = true;
            } else {
              var errs_1 = errors;
              if (typeof data.lastName !== "string") {
                validate.errors = [{
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/lastName',
                  schemaPath: '#/properties/lastName/type',
                  params: {
                    type: 'string'
                  },
                  message: 'should be string'
                }];
                return false;
              }
              var valid1 = errors === errs_1;
            }
            if (valid1) {
              if (data.birthDate === undefined) {
                valid1 = true;
              } else {
                var errs_1 = errors;
                if (typeof data.birthDate !== "string") {
                  validate.errors = [{
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/birthDate',
                    schemaPath: '#/properties/birthDate/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  }];
                  return false;
                }
                var valid1 = errors === errs_1;
              }
              if (valid1) {
                var data1 = data.gender;
                if (data1 === undefined) {
                  valid1 = true;
                } else {
                  var errs_1 = errors;
                  if (typeof data1 !== "string") {
                    validate.errors = [{
                      keyword: 'type',
                      dataPath: (dataPath || '') + '/gender',
                      schemaPath: '#/properties/gender/type',
                      params: {
                        type: 'string'
                      },
                      message: 'should be string'
                    }];
                    return false;
                  }
                  var schema1 = validate.schema.properties.gender.enum;
                  var valid1;
                  valid1 = false;
                  for (var i1 = 0; i1 < schema1.length; i1++)
                    if (equal(data1, schema1[i1])) {
                      valid1 = true;
                      break;
                    } if (!valid1) {
                    validate.errors = [{
                      keyword: 'enum',
                      dataPath: (dataPath || '') + '/gender',
                      schemaPath: '#/properties/gender/enum',
                      params: {
                        allowedValues: schema1
                      },
                      message: 'should be equal to one of the allowed values'
                    }];
                    return false;
                  }
                  var valid1 = errors === errs_1;
                }
                if (valid1) {
                  if (data.email === undefined) {
                    valid1 = true;
                  } else {
                    var errs_1 = errors;
                    if (typeof data.email !== "string") {
                      validate.errors = [{
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/email',
                        schemaPath: '#/properties/email/type',
                        params: {
                          type: 'string'
                        },
                        message: 'should be string'
                      }];
                      return false;
                    }
                    var valid1 = errors === errs_1;
                  }
                  if (valid1) {
                    if (data.phone === undefined) {
                      valid1 = true;
                    } else {
                      var errs_1 = errors;
                      if (typeof data.phone !== "string") {
                        validate.errors = [{
                          keyword: 'type',
                          dataPath: (dataPath || '') + '/phone',
                          schemaPath: '#/properties/phone/type',
                          params: {
                            type: 'string'
                          },
                          message: 'should be string'
                        }];
                        return false;
                      }
                      var valid1 = errors === errs_1;
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate.errors = [{
        keyword: 'type',
        dataPath: (dataPath || '') + "",
        schemaPath: '#/type',
        params: {
          type: 'object'
        },
        message: 'should be object'
      }];
      return false;
    }
    validate.errors = vErrors;
    return errors === 0;
  };
})();
validate.schema = {
  "$schema": "http://json-schema.org/schema#",
  "$id": "https://schema.croct.io/web/user-signed-up.json",
  "type": "object",
  "properties": {
    "token": {
      "type": "string"
    },
    "firstName": {
      "type": "string"
    },
    "lastName": {
      "type": "string"
    },
    "birthDate": {
      "type": "string"
    },
    "gender": {
      "type": "string",
      "enum": ["male", "female", "neutral"]
    },
    "email": {
      "type": "string"
    },
    "phone": {
      "type": "string"
    }
  },
  "required": ["token"]
};
validate.errors = null;
module.exports = validate;