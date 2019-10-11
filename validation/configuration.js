'use strict';
var ucs2length = require('ajv/lib/compile/ucs2length');
var equal = require('ajv/lib/compile/equal');
var validate = (function() {
  var pattern0 = new RegExp('^[a-f0-9]{8}(-[a-f0-9]{4}){4}[a-f0-9]{8}$');
  var refVal = [];
  return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
    'use strict'; /*# sourceURL=https://schema.croct.io/web/configuration.json */
    var vErrors = null;
    var errors = 0;
    if ((data && typeof data === "object" && !Array.isArray(data))) {
      if (true) {
        var errs__0 = errors;
        var valid1 = true;
        for (var key0 in data) {
          var isAdditional0 = !(false || key0 == 'apiKey' || key0 == 'storageNamespace' || key0 == 'tokenScope' || key0 == 'debug' || key0 == 'track');
          if (isAdditional0) {
            valid1 = false;
            validate.errors = [{
              keyword: 'additionalProperties',
              dataPath: (dataPath || '') + "",
              schemaPath: '#/additionalProperties',
              params: {
                additionalProperty: '' + key0 + ''
              },
              message: 'should NOT have additional properties'
            }];
            return false;
            break;
          }
        }
        if (valid1) {
          var data1 = data.apiKey;
          if (data1 === undefined) {
            valid1 = false;
            validate.errors = [{
              keyword: 'required',
              dataPath: (dataPath || '') + "",
              schemaPath: '#/required',
              params: {
                missingProperty: 'apiKey'
              },
              message: 'should have required property \'apiKey\''
            }];
            return false;
          } else {
            var errs_1 = errors;
            if (typeof data1 === "string") {
              if (!pattern0.test(data1)) {
                validate.errors = [{
                  keyword: 'pattern',
                  dataPath: (dataPath || '') + '/apiKey',
                  schemaPath: '#/properties/apiKey/pattern',
                  params: {
                    pattern: '^[a-f0-9]{8}(-[a-f0-9]{4}){4}[a-f0-9]{8}$'
                  },
                  message: 'should match pattern "^[a-f0-9]{8}(-[a-f0-9]{4}){4}[a-f0-9]{8}$"'
                }];
                return false;
              }
            } else {
              validate.errors = [{
                keyword: 'type',
                dataPath: (dataPath || '') + '/apiKey',
                schemaPath: '#/properties/apiKey/type',
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
            var data1 = data.storageNamespace;
            if (data1 === undefined) {
              valid1 = true;
            } else {
              var errs_1 = errors;
              if (typeof data1 === "string") {
                if (ucs2length(data1) < 1) {
                  validate.errors = [{
                    keyword: 'minLength',
                    dataPath: (dataPath || '') + '/storageNamespace',
                    schemaPath: '#/properties/storageNamespace/minLength',
                    params: {
                      limit: 1
                    },
                    message: 'should NOT be shorter than 1 characters'
                  }];
                  return false;
                }
              } else {
                validate.errors = [{
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/storageNamespace',
                  schemaPath: '#/properties/storageNamespace/type',
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
              var data1 = data.tokenScope;
              if (data1 === undefined) {
                valid1 = true;
              } else {
                var errs_1 = errors;
                if (typeof data1 !== "string") {
                  validate.errors = [{
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/tokenScope',
                    schemaPath: '#/properties/tokenScope/type',
                    params: {
                      type: 'string'
                    },
                    message: 'should be string'
                  }];
                  return false;
                }
                var schema1 = validate.schema.properties.tokenScope.enum;
                var valid1;
                valid1 = false;
                for (var i1 = 0; i1 < schema1.length; i1++)
                  if (equal(data1, schema1[i1])) {
                    valid1 = true;
                    break;
                  } if (!valid1) {
                  validate.errors = [{
                    keyword: 'enum',
                    dataPath: (dataPath || '') + '/tokenScope',
                    schemaPath: '#/properties/tokenScope/enum',
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
                if (data.debug === undefined) {
                  valid1 = true;
                } else {
                  var errs_1 = errors;
                  if (typeof data.debug !== "boolean") {
                    validate.errors = [{
                      keyword: 'type',
                      dataPath: (dataPath || '') + '/debug',
                      schemaPath: '#/properties/debug/type',
                      params: {
                        type: 'boolean'
                      },
                      message: 'should be boolean'
                    }];
                    return false;
                  }
                  var valid1 = errors === errs_1;
                }
                if (valid1) {
                  if (data.track === undefined) {
                    valid1 = true;
                  } else {
                    var errs_1 = errors;
                    if (typeof data.track !== "boolean") {
                      validate.errors = [{
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/track',
                        schemaPath: '#/properties/track/type',
                        params: {
                          type: 'boolean'
                        },
                        message: 'should be boolean'
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
  "$id": "https://schema.croct.io/web/configuration.json",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "apiKey": {
      "type": "string",
      "pattern": "^[a-f0-9]{8}(-[a-f0-9]{4}){4}[a-f0-9]{8}$"
    },
    "storageNamespace": {
      "type": "string",
      "minLength": 1
    },
    "tokenScope": {
      "type": "string",
      "enum": ["global", "contextual", "isolated"]
    },
    "debug": {
      "type": "boolean"
    },
    "track": {
      "type": "boolean"
    }
  },
  "required": ["apiKey"]
};
validate.errors = null;
module.exports = validate;