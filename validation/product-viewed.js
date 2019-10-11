'use strict';
var validate = (function() {
  var refVal = [];
  var refVal1 = (function() {
    var refVal = [];
    return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
      'use strict'; /*# sourceURL=https://schema.croct.io/web/product-details.json */
      var vErrors = null;
      var errors = 0;
      if ((data && typeof data === "object" && !Array.isArray(data))) {
        if (true) {
          var errs__0 = errors;
          var valid1 = true;
          if (data.productId === undefined) {
            valid1 = true;
          } else {
            var errs_1 = errors;
            if (typeof data.productId !== "string") {
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
            if (data.productSku === undefined) {
              valid1 = true;
            } else {
              var errs_1 = errors;
              if (typeof data.productSku !== "string") {
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
              if (data.name === undefined) {
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
                if (typeof data.name !== "string") {
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
                if (data.category === undefined) {
                  valid1 = true;
                } else {
                  var errs_1 = errors;
                  if (typeof data.category !== "string") {
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
                  if (data.brand === undefined) {
                    valid1 = true;
                  } else {
                    var errs_1 = errors;
                    if (typeof data.brand !== "string") {
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
                    if (data.variant === undefined) {
                      valid1 = true;
                    } else {
                      var errs_1 = errors;
                      if (typeof data.variant !== "string") {
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
                      if (data.displayPrice === undefined) {
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
                        if (typeof data.displayPrice !== "number") {
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
                        if (data.originalPrice === undefined) {
                          valid1 = true;
                        } else {
                          var errs_1 = errors;
                          if (typeof data.originalPrice !== "number") {
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
                          if (data.url === undefined) {
                            valid1 = true;
                          } else {
                            var errs_1 = errors;
                            if (typeof data.url !== "string") {
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
                            var valid1 = errors === errs_1;
                          }
                          if (valid1) {
                            if (data.imageUrl === undefined) {
                              valid1 = true;
                            } else {
                              var errs_1 = errors;
                              if (typeof data.imageUrl !== "string") {
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
  refVal1.schema = {
    "$schema": "http://json-schema.org/schema#",
    "$id": "https://schema.croct.io/web/product-details.json",
    "type": "object",
    "properties": {
      "productId": {
        "type": "string"
      },
      "productSku": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "category": {
        "type": "string"
      },
      "brand": {
        "type": "string"
      },
      "variant": {
        "type": "string"
      },
      "displayPrice": {
        "type": "number"
      },
      "originalPrice": {
        "type": "number"
      },
      "url": {
        "type": "string"
      },
      "imageUrl": {
        "type": "string"
      }
    },
    "required": ["name", "displayPrice"]
  };
  refVal1.errors = null;
  refVal[1] = refVal1;
  return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
    'use strict'; /*# sourceURL=https://schema.croct.io/web/product-viewed.json */
    var vErrors = null;
    var errors = 0;
    if (rootData === undefined) rootData = data;
    if ((data && typeof data === "object" && !Array.isArray(data))) {
      if (true) {
        var errs__0 = errors;
        var valid1 = true;
        if (data.url === undefined) {
          valid1 = false;
          validate.errors = [{
            keyword: 'required',
            dataPath: (dataPath || '') + "",
            schemaPath: '#/required',
            params: {
              missingProperty: 'url'
            },
            message: 'should have required property \'url\''
          }];
          return false;
        } else {
          var errs_1 = errors;
          if (typeof data.url !== "string") {
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
          var valid1 = errors === errs_1;
        }
        if (valid1) {
          if (data.productDetails === undefined) {
            valid1 = false;
            validate.errors = [{
              keyword: 'required',
              dataPath: (dataPath || '') + "",
              schemaPath: '#/required',
              params: {
                missingProperty: 'productDetails'
              },
              message: 'should have required property \'productDetails\''
            }];
            return false;
          } else {
            var errs_1 = errors;
            if (!refVal1(data.productDetails, (dataPath || '') + '/productDetails', data, 'productDetails', rootData)) {
              if (vErrors === null) vErrors = refVal1.errors;
              else vErrors = vErrors.concat(refVal1.errors);
              errors = vErrors.length;
            }
            var valid1 = errors === errs_1;
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
  "$id": "https://schema.croct.io/web/product-viewed.json",
  "type": "object",
  "properties": {
    "url": {
      "type": "string"
    },
    "productDetails": {
      "$ref": "https://schema.croct.io/web/product-details.json"
    }
  },
  "required": ["url", "productDetails"]
};
validate.errors = null;
module.exports = validate;