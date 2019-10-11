'use strict';
var formats = require('ajv/lib/compile/formats')();
var ucs2length = require('ajv/lib/compile/ucs2length');
var equal = require('ajv/lib/compile/equal');
var validate = (function() {
  var refVal = [];
  return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
    'use strict'; /*# sourceURL=https://schema.croct.io/sdk/web/user-signed-up.json */
    var vErrors = null;
    var errors = 0;
    if ((data && typeof data === "object" && !Array.isArray(data))) {
      if (true) {
        var errs__0 = errors;
        var valid1 = true;
        var data1 = data.token;
        if (data1 === undefined) {
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
          if (typeof data1 === "string") {
            if (ucs2length(data1) > 100) {
              validate.errors = [{
                keyword: 'maxLength',
                dataPath: (dataPath || '') + '/token',
                schemaPath: '#/properties/token/maxLength',
                params: {
                  limit: 100
                },
                message: 'should NOT be longer than 100 characters'
              }];
              return false;
            } else {
              if (ucs2length(data1) < 1) {
                validate.errors = [{
                  keyword: 'minLength',
                  dataPath: (dataPath || '') + '/token',
                  schemaPath: '#/properties/token/minLength',
                  params: {
                    limit: 1
                  },
                  message: 'should NOT be shorter than 1 characters'
                }];
                return false;
              }
            }
          } else {
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
          var data1 = data.firstName;
          if (data1 === undefined) {
            valid1 = true;
          } else {
            var errs_1 = errors;
            if (typeof data1 === "string") {
              if (ucs2length(data1) > 100) {
                validate.errors = [{
                  keyword: 'maxLength',
                  dataPath: (dataPath || '') + '/firstName',
                  schemaPath: '#/properties/firstName/maxLength',
                  params: {
                    limit: 100
                  },
                  message: 'should NOT be longer than 100 characters'
                }];
                return false;
              } else {
                if (ucs2length(data1) < 1) {
                  validate.errors = [{
                    keyword: 'minLength',
                    dataPath: (dataPath || '') + '/firstName',
                    schemaPath: '#/properties/firstName/minLength',
                    params: {
                      limit: 1
                    },
                    message: 'should NOT be shorter than 1 characters'
                  }];
                  return false;
                }
              }
            } else {
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
            var data1 = data.lastName;
            if (data1 === undefined) {
              valid1 = true;
            } else {
              var errs_1 = errors;
              if (typeof data1 === "string") {
                if (ucs2length(data1) > 100) {
                  validate.errors = [{
                    keyword: 'maxLength',
                    dataPath: (dataPath || '') + '/lastName',
                    schemaPath: '#/properties/lastName/maxLength',
                    params: {
                      limit: 100
                    },
                    message: 'should NOT be longer than 100 characters'
                  }];
                  return false;
                } else {
                  if (ucs2length(data1) < 1) {
                    validate.errors = [{
                      keyword: 'minLength',
                      dataPath: (dataPath || '') + '/lastName',
                      schemaPath: '#/properties/lastName/minLength',
                      params: {
                        limit: 1
                      },
                      message: 'should NOT be shorter than 1 characters'
                    }];
                    return false;
                  }
                }
              } else {
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
              var data1 = data.birthDate;
              if (data1 === undefined) {
                valid1 = true;
              } else {
                var errs_1 = errors;
                if (errors === errs_1) {
                  if (typeof data1 === "string") {
                    if (!formats.date.test(data1)) {
                      validate.errors = [{
                        keyword: 'format',
                        dataPath: (dataPath || '') + '/birthDate',
                        schemaPath: '#/properties/birthDate/format',
                        params: {
                          format: 'date'
                        },
                        message: 'should match format "date"'
                      }];
                      return false;
                    }
                  } else {
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
                  var data1 = data.email;
                  if (data1 === undefined) {
                    valid1 = true;
                  } else {
                    var errs_1 = errors;
                    if (typeof data1 === "string") {
                      if (ucs2length(data1) > 100) {
                        validate.errors = [{
                          keyword: 'maxLength',
                          dataPath: (dataPath || '') + '/email',
                          schemaPath: '#/properties/email/maxLength',
                          params: {
                            limit: 100
                          },
                          message: 'should NOT be longer than 100 characters'
                        }];
                        return false;
                      } else {
                        if (ucs2length(data1) < 1) {
                          validate.errors = [{
                            keyword: 'minLength',
                            dataPath: (dataPath || '') + '/email',
                            schemaPath: '#/properties/email/minLength',
                            params: {
                              limit: 1
                            },
                            message: 'should NOT be shorter than 1 characters'
                          }];
                          return false;
                        }
                      }
                    } else {
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
                    var data1 = data.phone;
                    if (data1 === undefined) {
                      valid1 = true;
                    } else {
                      var errs_1 = errors;
                      if (typeof data1 === "string") {
                        if (ucs2length(data1) > 50) {
                          validate.errors = [{
                            keyword: 'maxLength',
                            dataPath: (dataPath || '') + '/phone',
                            schemaPath: '#/properties/phone/maxLength',
                            params: {
                              limit: 50
                            },
                            message: 'should NOT be longer than 50 characters'
                          }];
                          return false;
                        } else {
                          if (ucs2length(data1) < 1) {
                            validate.errors = [{
                              keyword: 'minLength',
                              dataPath: (dataPath || '') + '/phone',
                              schemaPath: '#/properties/phone/minLength',
                              params: {
                                limit: 1
                              },
                              message: 'should NOT be shorter than 1 characters'
                            }];
                            return false;
                          }
                        }
                      } else {
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
  "$id": "https://schema.croct.io/sdk/web/user-signed-up.json",
  "type": "object",
  "properties": {
    "token": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "firstName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "lastName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "birthDate": {
      "type": "string",
      "format": "date"
    },
    "gender": {
      "type": "string",
      "enum": ["male", "female", "neutral"]
    },
    "email": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "phone": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50
    }
  },
  "required": ["token"]
};
validate.errors = null;
module.exports = validate;