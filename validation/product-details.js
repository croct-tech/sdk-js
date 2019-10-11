'use strict';
var formats = require('ajv/lib/compile/formats')();
var ucs2length = require('ajv/lib/compile/ucs2length');
var validate = (function() {
  var refVal = [];
  return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
    'use strict'; /*# sourceURL=https://schema.croct.io/sdk/web/product-details.json */
    var vErrors = null;
    var errors = 0;
    if ((data && typeof data === "object" && !Array.isArray(data))) {
      if (true) {
        var errs__0 = errors;
        var valid1 = true;
        var data1 = data.productId;
        if (data1 === undefined) {
          valid1 = true;
        } else {
          var errs_1 = errors;
          if (typeof data1 === "string") {
            if (ucs2length(data1) > 50) {
              validate.errors = [{
                keyword: 'maxLength',
                dataPath: (dataPath || '') + '/productId',
                schemaPath: '#/properties/productId/maxLength',
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
                  dataPath: (dataPath || '') + '/productId',
                  schemaPath: '#/properties/productId/minLength',
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
              dataPath: (dataPath || '') + '/productId',
              schemaPath: '#/properties/productId/type',
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
          var data1 = data.productSku;
          if (data1 === undefined) {
            valid1 = true;
          } else {
            var errs_1 = errors;
            if (typeof data1 === "string") {
              if (ucs2length(data1) > 50) {
                validate.errors = [{
                  keyword: 'maxLength',
                  dataPath: (dataPath || '') + '/productSku',
                  schemaPath: '#/properties/productSku/maxLength',
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
                    dataPath: (dataPath || '') + '/productSku',
                    schemaPath: '#/properties/productSku/minLength',
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
                dataPath: (dataPath || '') + '/productSku',
                schemaPath: '#/properties/productSku/type',
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
            var data1 = data.name;
            if (data1 === undefined) {
              valid1 = false;
              validate.errors = [{
                keyword: 'required',
                dataPath: (dataPath || '') + "",
                schemaPath: '#/required',
                params: {
                  missingProperty: 'name'
                },
                message: 'should have required property \'name\''
              }];
              return false;
            } else {
              var errs_1 = errors;
              if (typeof data1 === "string") {
                if (ucs2length(data1) > 200) {
                  validate.errors = [{
                    keyword: 'maxLength',
                    dataPath: (dataPath || '') + '/name',
                    schemaPath: '#/properties/name/maxLength',
                    params: {
                      limit: 200
                    },
                    message: 'should NOT be longer than 200 characters'
                  }];
                  return false;
                } else {
                  if (ucs2length(data1) < 1) {
                    validate.errors = [{
                      keyword: 'minLength',
                      dataPath: (dataPath || '') + '/name',
                      schemaPath: '#/properties/name/minLength',
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
                  dataPath: (dataPath || '') + '/name',
                  schemaPath: '#/properties/name/type',
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
              var data1 = data.category;
              if (data1 === undefined) {
                valid1 = true;
              } else {
                var errs_1 = errors;
                if (typeof data1 === "string") {
                  if (ucs2length(data1) > 100) {
                    validate.errors = [{
                      keyword: 'maxLength',
                      dataPath: (dataPath || '') + '/category',
                      schemaPath: '#/properties/category/maxLength',
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
                        dataPath: (dataPath || '') + '/category',
                        schemaPath: '#/properties/category/minLength',
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
                    dataPath: (dataPath || '') + '/category',
                    schemaPath: '#/properties/category/type',
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
                var data1 = data.brand;
                if (data1 === undefined) {
                  valid1 = true;
                } else {
                  var errs_1 = errors;
                  if (typeof data1 === "string") {
                    if (ucs2length(data1) > 100) {
                      validate.errors = [{
                        keyword: 'maxLength',
                        dataPath: (dataPath || '') + '/brand',
                        schemaPath: '#/properties/brand/maxLength',
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
                          dataPath: (dataPath || '') + '/brand',
                          schemaPath: '#/properties/brand/minLength',
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
                      dataPath: (dataPath || '') + '/brand',
                      schemaPath: '#/properties/brand/type',
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
                  var data1 = data.variant;
                  if (data1 === undefined) {
                    valid1 = true;
                  } else {
                    var errs_1 = errors;
                    if (typeof data1 === "string") {
                      if (ucs2length(data1) > 50) {
                        validate.errors = [{
                          keyword: 'maxLength',
                          dataPath: (dataPath || '') + '/variant',
                          schemaPath: '#/properties/variant/maxLength',
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
                            dataPath: (dataPath || '') + '/variant',
                            schemaPath: '#/properties/variant/minLength',
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
                        dataPath: (dataPath || '') + '/variant',
                        schemaPath: '#/properties/variant/type',
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
                    var data1 = data.displayPrice;
                    if (data1 === undefined) {
                      valid1 = false;
                      validate.errors = [{
                        keyword: 'required',
                        dataPath: (dataPath || '') + "",
                        schemaPath: '#/required',
                        params: {
                          missingProperty: 'displayPrice'
                        },
                        message: 'should have required property \'displayPrice\''
                      }];
                      return false;
                    } else {
                      var errs_1 = errors;
                      if (typeof data1 === "number") {
                        if (data1 < 0 || data1 !== data1) {
                          validate.errors = [{
                            keyword: 'minimum',
                            dataPath: (dataPath || '') + '/displayPrice',
                            schemaPath: '#/properties/displayPrice/minimum',
                            params: {
                              comparison: '>=',
                              limit: 0,
                              exclusive: false
                            },
                            message: 'should be >= 0'
                          }];
                          return false;
                        }
                      } else {
                        validate.errors = [{
                          keyword: 'type',
                          dataPath: (dataPath || '') + '/displayPrice',
                          schemaPath: '#/properties/displayPrice/type',
                          params: {
                            type: 'number'
                          },
                          message: 'should be number'
                        }];
                        return false;
                      }
                      var valid1 = errors === errs_1;
                    }
                    if (valid1) {
                      var data1 = data.originalPrice;
                      if (data1 === undefined) {
                        valid1 = true;
                      } else {
                        var errs_1 = errors;
                        if (typeof data1 === "number") {
                          if (data1 < 0 || data1 !== data1) {
                            validate.errors = [{
                              keyword: 'minimum',
                              dataPath: (dataPath || '') + '/originalPrice',
                              schemaPath: '#/properties/originalPrice/minimum',
                              params: {
                                comparison: '>=',
                                limit: 0,
                                exclusive: false
                              },
                              message: 'should be >= 0'
                            }];
                            return false;
                          }
                        } else {
                          validate.errors = [{
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/originalPrice',
                            schemaPath: '#/properties/originalPrice/type',
                            params: {
                              type: 'number'
                            },
                            message: 'should be number'
                          }];
                          return false;
                        }
                        var valid1 = errors === errs_1;
                      }
                      if (valid1) {
                        var data1 = data.url;
                        if (data1 === undefined) {
                          valid1 = true;
                        } else {
                          var errs_1 = errors;
                          if (errors === errs_1) {
                            if (typeof data1 === "string") {
                              if (!formats.url.test(data1)) {
                                validate.errors = [{
                                  keyword: 'format',
                                  dataPath: (dataPath || '') + '/url',
                                  schemaPath: '#/properties/url/format',
                                  params: {
                                    format: 'url'
                                  },
                                  message: 'should match format "url"'
                                }];
                                return false;
                              }
                            } else {
                              validate.errors = [{
                                keyword: 'type',
                                dataPath: (dataPath || '') + '/url',
                                schemaPath: '#/properties/url/type',
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
                          var data1 = data.imageUrl;
                          if (data1 === undefined) {
                            valid1 = true;
                          } else {
                            var errs_1 = errors;
                            if (errors === errs_1) {
                              if (typeof data1 === "string") {
                                if (!formats.url.test(data1)) {
                                  validate.errors = [{
                                    keyword: 'format',
                                    dataPath: (dataPath || '') + '/imageUrl',
                                    schemaPath: '#/properties/imageUrl/format',
                                    params: {
                                      format: 'url'
                                    },
                                    message: 'should match format "url"'
                                  }];
                                  return false;
                                }
                              } else {
                                validate.errors = [{
                                  keyword: 'type',
                                  dataPath: (dataPath || '') + '/imageUrl',
                                  schemaPath: '#/properties/imageUrl/type',
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
                        }
                      }
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
  "$id": "https://schema.croct.io/sdk/web/product-details.json",
  "type": "object",
  "properties": {
    "productId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50
    },
    "productSku": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "category": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "brand": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "variant": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50
    },
    "displayPrice": {
      "type": "number",
      "minimum": 0
    },
    "originalPrice": {
      "type": "number",
      "minimum": 0
    },
    "url": {
      "type": "string",
      "format": "url"
    },
    "imageUrl": {
      "type": "string",
      "format": "url"
    }
  },
  "required": ["name", "displayPrice"]
};
validate.errors = null;
module.exports = validate;