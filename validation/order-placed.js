'use strict';
var equal = require('ajv/lib/compile/equal');
var validate = (function() {
  var refVal = [];
  var refVal1 = (function() {
    var refVal = [];
    var refVal1 = (function() {
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
        'use strict'; /*# sourceURL=https://schema.croct.io/web/order-item.json */
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
    refVal1.schema = {
      "$schema": "http://json-schema.org/schema#",
      "$id": "https://schema.croct.io/web/order-item.json",
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
    refVal1.errors = null;
    refVal[1] = refVal1;
    return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
      'use strict'; /*# sourceURL=https://schema.croct.io/web/order.json */
      var vErrors = null;
      var errors = 0;
      if (rootData === undefined) rootData = data;
      if ((data && typeof data === "object" && !Array.isArray(data))) {
        if (true) {
          var errs__0 = errors;
          var valid1 = true;
          if (data.cartId === undefined) {
            valid1 = true;
          } else {
            var errs_1 = errors;
            if (typeof data.cartId !== "string") {
              validate.errors = [{
                keyword: 'type',
                dataPath: (dataPath || '') + '/cartId',
                schemaPath: '#/properties/cartId/type',
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
            if (data.orderId === undefined) {
              valid1 = false;
              validate.errors = [{
                keyword: 'required',
                dataPath: (dataPath || '') + "",
                schemaPath: '#/required',
                params: {
                  missingProperty: 'orderId'
                },
                message: 'should have required property \'orderId\''
              }];
              return false;
            } else {
              var errs_1 = errors;
              if (typeof data.orderId !== "string") {
                validate.errors = [{
                  keyword: 'type',
                  dataPath: (dataPath || '') + '/orderId',
                  schemaPath: '#/properties/orderId/type',
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
              if (data.currency === undefined) {
                valid1 = false;
                validate.errors = [{
                  keyword: 'required',
                  dataPath: (dataPath || '') + "",
                  schemaPath: '#/required',
                  params: {
                    missingProperty: 'currency'
                  },
                  message: 'should have required property \'currency\''
                }];
                return false;
              } else {
                var errs_1 = errors;
                if (typeof data.currency !== "string") {
                  validate.errors = [{
                    keyword: 'type',
                    dataPath: (dataPath || '') + '/currency',
                    schemaPath: '#/properties/currency/type',
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
                var data1 = data.items;
                if (data1 === undefined) {
                  valid1 = false;
                  validate.errors = [{
                    keyword: 'required',
                    dataPath: (dataPath || '') + "",
                    schemaPath: '#/required',
                    params: {
                      missingProperty: 'items'
                    },
                    message: 'should have required property \'items\''
                  }];
                  return false;
                } else {
                  var errs_1 = errors;
                  if (Array.isArray(data1)) {
                    var errs__1 = errors;
                    var valid1;
                    for (var i1 = 0; i1 < data1.length; i1++) {
                      var errs_2 = errors;
                      if (!refVal1(data1[i1], (dataPath || '') + '/items/' + i1, data1, i1, rootData)) {
                        if (vErrors === null) vErrors = refVal1.errors;
                        else vErrors = vErrors.concat(refVal1.errors);
                        errors = vErrors.length;
                      }
                      var valid2 = errors === errs_2;
                      if (!valid2) break;
                    }
                  } else {
                    validate.errors = [{
                      keyword: 'type',
                      dataPath: (dataPath || '') + '/items',
                      schemaPath: '#/properties/items/type',
                      params: {
                        type: 'array'
                      },
                      message: 'should be array'
                    }];
                    return false;
                  }
                  var valid1 = errors === errs_1;
                }
                if (valid1) {
                  if (data.subtotal === undefined) {
                    valid1 = true;
                  } else {
                    var errs_1 = errors;
                    if (typeof data.subtotal !== "number") {
                      validate.errors = [{
                        keyword: 'type',
                        dataPath: (dataPath || '') + '/subtotal',
                        schemaPath: '#/properties/subtotal/type',
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
                    if (data.shippingPrice === undefined) {
                      valid1 = true;
                    } else {
                      var errs_1 = errors;
                      if (typeof data.shippingPrice !== "number") {
                        validate.errors = [{
                          keyword: 'type',
                          dataPath: (dataPath || '') + '/shippingPrice',
                          schemaPath: '#/properties/shippingPrice/type',
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
                      var data1 = data.taxes;
                      if (data1 === undefined) {
                        valid1 = true;
                      } else {
                        var errs_1 = errors;
                        if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
                          var errs__1 = errors;
                          var valid2 = true;
                          for (var key1 in data1) {
                            var errs_2 = errors;
                            if (typeof data1[key1] !== "number") {
                              validate.errors = [{
                                keyword: 'type',
                                dataPath: (dataPath || '') + '/taxes/' + key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                                schemaPath: '#/properties/taxes/additionalProperties/type',
                                params: {
                                  type: 'number'
                                },
                                message: 'should be number'
                              }];
                              return false;
                            }
                            var valid2 = errors === errs_2;
                            if (!valid2) break;
                          }
                        } else {
                          validate.errors = [{
                            keyword: 'type',
                            dataPath: (dataPath || '') + '/taxes',
                            schemaPath: '#/properties/taxes/type',
                            params: {
                              type: 'object'
                            },
                            message: 'should be object'
                          }];
                          return false;
                        }
                        var valid1 = errors === errs_1;
                      }
                      if (valid1) {
                        var data1 = data.costs;
                        if (data1 === undefined) {
                          valid1 = true;
                        } else {
                          var errs_1 = errors;
                          if ((data1 && typeof data1 === "object" && !Array.isArray(data1))) {
                            var errs__1 = errors;
                            var valid2 = true;
                            for (var key1 in data1) {
                              var errs_2 = errors;
                              if (typeof data1[key1] !== "number") {
                                validate.errors = [{
                                  keyword: 'type',
                                  dataPath: (dataPath || '') + '/costs/' + key1.replace(/~/g, '~0').replace(/\//g, '~1'),
                                  schemaPath: '#/properties/costs/additionalProperties/type',
                                  params: {
                                    type: 'number'
                                  },
                                  message: 'should be number'
                                }];
                                return false;
                              }
                              var valid2 = errors === errs_2;
                              if (!valid2) break;
                            }
                          } else {
                            validate.errors = [{
                              keyword: 'type',
                              dataPath: (dataPath || '') + '/costs',
                              schemaPath: '#/properties/costs/type',
                              params: {
                                type: 'object'
                              },
                              message: 'should be object'
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
                              if (valid1) {
                                if (data.paymentMethod === undefined) {
                                  valid1 = true;
                                } else {
                                  var errs_1 = errors;
                                  if (typeof data.paymentMethod !== "string") {
                                    validate.errors = [{
                                      keyword: 'type',
                                      dataPath: (dataPath || '') + '/paymentMethod',
                                      schemaPath: '#/properties/paymentMethod/type',
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
                                  var data1 = data.installments;
                                  if (data1 === undefined) {
                                    valid1 = true;
                                  } else {
                                    var errs_1 = errors;
                                    if ((typeof data1 !== "number" || (data1 % 1) || data1 !== data1)) {
                                      validate.errors = [{
                                        keyword: 'type',
                                        dataPath: (dataPath || '') + '/installments',
                                        schemaPath: '#/properties/installments/type',
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
                                    var data1 = data.status;
                                    if (data1 === undefined) {
                                      valid1 = true;
                                    } else {
                                      var errs_1 = errors;
                                      if (typeof data1 !== "string") {
                                        validate.errors = [{
                                          keyword: 'type',
                                          dataPath: (dataPath || '') + '/status',
                                          schemaPath: '#/properties/status/type',
                                          params: {
                                            type: 'string'
                                          },
                                          message: 'should be string'
                                        }];
                                        return false;
                                      }
                                      var schema1 = validate.schema.properties.status.enum;
                                      var valid1;
                                      valid1 = false;
                                      for (var i1 = 0; i1 < schema1.length; i1++)
                                        if (equal(data1, schema1[i1])) {
                                          valid1 = true;
                                          break;
                                        } if (!valid1) {
                                        validate.errors = [{
                                          keyword: 'enum',
                                          dataPath: (dataPath || '') + '/status',
                                          schemaPath: '#/properties/status/enum',
                                          params: {
                                            allowedValues: schema1
                                          },
                                          message: 'should be equal to one of the allowed values'
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
    "$id": "https://schema.croct.io/web/order.json",
    "type": "object",
    "properties": {
      "cartId": {
        "type": "string"
      },
      "orderId": {
        "type": "string"
      },
      "currency": {
        "type": "string"
      },
      "items": {
        "type": "array",
        "items": {
          "$ref": "https://schema.croct.io/web/order-item.json"
        }
      },
      "subtotal": {
        "type": "number"
      },
      "shippingPrice": {
        "type": "number"
      },
      "taxes": {
        "type": "object",
        "additionalProperties": {
          "type": "number"
        }
      },
      "costs": {
        "type": "object",
        "additionalProperties": {
          "type": "number"
        }
      },
      "discount": {
        "type": "number"
      },
      "total": {
        "type": "number"
      },
      "coupon": {
        "type": "string"
      },
      "paymentMethod": {
        "type": "string"
      },
      "installments": {
        "type": "integer"
      },
      "status": {
        "type": "string",
        "enum": ["placed", "paid", "complete"]
      }
    },
    "required": ["orderId", "currency", "items", "total"]
  };
  refVal1.errors = null;
  refVal[1] = refVal1;
  return function validate(data, dataPath, parentData, parentDataProperty, rootData) {
    'use strict'; /*# sourceURL=https://schema.croct.io/web/order-placed.json */
    var vErrors = null;
    var errors = 0;
    if (rootData === undefined) rootData = data;
    if ((data && typeof data === "object" && !Array.isArray(data))) {
      if (true) {
        var errs__0 = errors;
        var valid1 = true;
        if (data.order === undefined) {
          valid1 = false;
          validate.errors = [{
            keyword: 'required',
            dataPath: (dataPath || '') + "",
            schemaPath: '#/required',
            params: {
              missingProperty: 'order'
            },
            message: 'should have required property \'order\''
          }];
          return false;
        } else {
          var errs_1 = errors;
          if (!refVal1(data.order, (dataPath || '') + '/order', data, 'order', rootData)) {
            if (vErrors === null) vErrors = refVal1.errors;
            else vErrors = vErrors.concat(refVal1.errors);
            errors = vErrors.length;
          }
          var valid1 = errors === errs_1;
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
  "$id": "https://schema.croct.io/web/order-placed.json",
  "type": "object",
  "properties": {
    "order": {
      "$ref": "https://schema.croct.io/web/order.json"
    }
  },
  "required": ["order"]
};
validate.errors = null;
module.exports = validate;