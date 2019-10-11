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
    'use strict'; /*# sourceURL=https://schema.croct.io/web/cart-item.json */
    var vErrors = null;
    var errors = 0;
    if (rootData === undefined) rootData = data;
    if ((data && typeof data === "object" && !Array.isArray(data))) {
      if (true) {
        var errs__0 = errors;
        var valid1 = true;
        var data1 = data.index;
        if (data1 === undefined) {
          valid1 = true;
        } else {
          var errs_1 = errors;
          if ((typeof data1 !== "number" || (data1 % 1) || data1 !== data1)) {
            validate.errors = [{
              keyword: 'type',
              dataPath: (dataPath || '') + '/index',
              schemaPath: '#/properties/index/type',
              params: {
                type: 'integer'
              },
              message: 'should be integer'
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
          if (valid1) {
            var data1 = data.quantity;
            if (data1 === undefined) {
              valid1 = false;
              validate.errors = [{
                keyword: 'required',
                dataPath: (dataPath || '') + "",
                schemaPath: '#/required',
                params: {
                  missingProperty: 'quantity'
                },
                message: 'should have required property \'quantity\''
              }];
              return false;
            } else {
              var errs_1 = errors;
              if ((typeof data1 !== "number" || (data1 % 1) || data1 !== data1)) {
                validate.errors = [{
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/quantity',
                  schemaPath: '#/properties/quantity/type',
                  params: {
                    type: 'integer'
                  },
                  message: 'should be integer'
                }];
                return false;
              }
              var valid1 = errors === errs_1;
            }
            if (valid1) {
              if (data.total === undefined) {
                valid1 = false;
                validate.errors = [{
                  keyword: 'required',
                  dataPath: (dataPath || '') + "",
                  schemaPath: '#/required',
                  params: {
                    missingProperty: 'total'
                  },
                  message: 'should have required property \'total\''
                }];
                return false;
              } else {
                var errs_1 = errors;
                if (typeof data.total !== "number") {
                  validate.errors = [{
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/total',
                    schemaPath: '#/properties/total/type',
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
                if (data.discount === undefined) {
                  valid1 = true;
                } else {
                  var errs_1 = errors;
                  if (typeof data.discount !== "number") {
                    validate.errors = [{
                      keyword: 'type',
                      dataPath: (dataPath || '') + '/discount',
                      schemaPath: '#/properties/discount/type',
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
                  if (data.coupon === undefined) {
                    valid1 = true;
                  } else {
                    var errs_1 = errors;
                    if (typeof data.coupon !== "string") {
                      validate.errors = [{
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/coupon',
                        schemaPath: '#/properties/coupon/type',
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
  "$id": "https://schema.croct.io/web/cart-item.json",
  "type": "object",
  "properties": {
    "index": {
      "type": "integer"
    },
    "productDetails": {
      "$ref": "https://schema.croct.io/web/product-details.json"
    },
    "quantity": {
      "type": "integer"
    },
    "total": {
      "type": "number"
    },
    "discount": {
      "type": "number"
    },
    "coupon": {
      "type": "string"
    }
  },
  "required": ["productDetails", "quantity", "total"]
};
validate.errors = null;
module.exports = validate;