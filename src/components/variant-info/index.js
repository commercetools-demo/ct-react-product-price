import { useContext, useState, useEffect } from 'react';
import AttributeInfo from '../attribute-info';
import PriceInfo from '../price-info';
import {
  Link
} from "react-router-dom";
import { callCT, requestBuilder } from '../../commercetools';

const VERBOSE=false;

const VariantInfo = ({variant}) => {

  
  const addToCart = async () => {

    const currency = sessionStorage.getItem('currency');
    const country = sessionStorage.getItem('country');
    const channelId = sessionStorage.getItem('channelId');
    const customerGroupId = sessionStorage.getItem('customerGroupId');
    const productId = sessionStorage.getItem('productId');
    const storeKey = sessionStorage.getItem('storeKey');

    let cart;
    const lineItem = {
      productId: productId,
      variantId: variant.id
    };
    if(channelId) {
      lineItem.distributionChannel={
        id: channelId,
        typeId: 'channel'
      }
    }

    let cartId = sessionStorage.getItem('cartId');

    if(cartId) {
      // Fetch latest version
      let result = await callCT({
        uri: requestBuilder.carts.byId(cartId).build(),
        method: 'GET'
      });
      if(result) {
        cart = result.body;
      }
    }
    if(cart) {
      
      // add item to current cart
      console.log('Adding to current cart',cartId,cart.version);
      callCT({
        uri: requestBuilder.carts.byId(cartId).build(),
        method: 'POST',
        body: {
          version: cart.version,
          actions: [{
            action: 'addLineItem',
            ...lineItem
          }]
        }
      });
    } else {
      // Create cart and add item in one go. Save cart id
      const createCartBody = {
        currency: currency,
        lineItems: [lineItem]
      };
      if(country) {
        createCartBody.country = country;
      }
      if(customerGroupId) {
        createCartBody.customerGroup = customerGroupId;
      }
      if(storeKey) {
        createCartBody.store = storeKey;
      }
    
      let result = await callCT({
        uri: requestBuilder.carts.build(),
        method: 'POST',
        body: createCartBody
      });
      if(result) {
        sessionStorage.setItem('cartId',result.body.id);
      }
    }
  }
  
  VERBOSE && console.log('variant',variant);
  return (
    <li>
        SKU: { variant.sku } <br></br>
        Variant Key:  { variant.key } <br></br>
        { variant.price
        ? <span>
            Price: (using price selection): {variant.price.value.centAmount/100}
            &nbsp;&nbsp;<button type="button" onClick={addToCart}>Add to Cart</button>
          </span>
        :
          <div>
            Prices:<br></br>
            <small>All prices displayed.  To use Price Selection logic, go to <Link to="/context">Context</Link><br></br>
            and select a currency (required), and one or more additional options.</small>
            <table border="1" cellSpacing="0">
              <thead>
                <tr>
                  <td>Currency</td>
                  <td>Country</td>                
                  <td>Channel</td>
                  <td>Customer Group</td>
                  <td>Price</td>
                </tr>
              </thead>
              <tbody>
              { variant.price
                ? <PriceInfo price={variant.price} />
                : variant.prices.map((price,index) => <PriceInfo key={index} price={price} />)
              }
              </tbody> 
            </table>
          </div>
        }
        <p></p>
        <h4>Attributes:</h4> { variant.attributes.map(attr => <AttributeInfo key={attr.name} attr={attr} />) } <br></br>
        <p></p>
    </li>
  );
}

export default VariantInfo
