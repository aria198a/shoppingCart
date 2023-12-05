let cartsData = [];
const shoppingCartTableTbody = document.querySelector('.shoppingCart-table-tbody');
const totalPriceDom = document.querySelector('.totalPrice');


function init() {
    getProductList();
    getCartsList();
}
init();

// axios 取得產品列表
function getProductList() {
  let productsData = [];
  axios.get(`${apiUrl}${apiPath}/products`)
    .then(function (response) {
      productsData = response.data.products;
      renderProductWrap(productsData);
    })
    .catch(function (error) {
        console.error('Error fetching product data:', error);
    })
};

// axios 取得購物車列表
function getCartsList() {
    axios.get(`${apiUrl}${apiPath}/carts`)
      .then(function (response) {
        cartsData = response.data;
        renderCartsList(cartsData);
      })
      .catch(function (error) {
        console.error('Error fetching product data:', error);
      })
}

// 渲染 產品列表
function renderProductWrap(data) {
    const productWrap = document.querySelector('.productWrap');
    let str = '';
    data.forEach(function (element) {
      let li = `<li class="productCard">
        <h4 class="productType">${element.category}</h4>
        <img src="${element.images}" alt="">
        <a href="#" class="addCardBtn" data-id="${element.id}">加入購物車</a>
        <h3>${element.title}</h3>
        <del class="originPrice">NT$${toThousands(element.origin_price)}</del>
        <p class="nowPrice">NT$${toThousands(element.price)}</p>
      </li>`;
      str += li;
    });
    productWrap.innerHTML = str;
};

// 渲染 購物車列表
function renderCartsList(data) {
    const dataCarts = data.carts;
    let str = '';
    let totalPrice = 0;
    dataCarts.forEach(function (element) {
      totalPrice += element.product.price * element.quantity;
      let tr = `<tr>
              <td>
                <div class="cardItem-title">
                  <img src="${element.product.images}" alt="">
                  <p>${element.product.title}</p>
                </div>
              </td>
              <td>NT$${toThousands(element.product.price)}</td>
              <td>${element.quantity}</td>
              <td>NT$${toThousands(element.product.price * element.quantity)}</td>
              <td class="discardBtn" data-id="${element.id}">
                <a href="#" class="material-icons">
                  clear
                </a>
              </td>
            </tr>`;
      str += tr;
    });
    shoppingCartTableTbody.innerHTML = str;
    totalPriceDom.innerHTML = `NT$${toThousands(data.finalTotal)}`;
}

// 產品加入購物車
const productWrap = document.querySelector('.productWrap');
productWrap.addEventListener('click', function (event) {
  event.preventDefault();
  const targetClass = event.target.getAttribute('class');
  if (targetClass !== 'addCardBtn') return;
  let numQuantity = 1;
  let productId = event.target.dataset.id;

  cartsData.carts.forEach(function (element) {
    if (element.product.id === productId) {
        numQuantity = element.quantity + 1;
    };
  });
  let postObj = {
    "data": {
      "productId": productId,
      "quantity": numQuantity
    },
  };
  axios.post(`${apiUrl}${apiPath}/carts`, postObj)
    .then(function (response) {
      // 重新渲染/更新購物車
      cartsData = response.data;
      renderCartsList(cartsData);
    })
    .catch(function (error) {
        console.error('Error fetching product data:', error);
    })
});

// 購物車點擊刪除
const shoppingCartTable = document.querySelector('.shoppingCart-table');
shoppingCartTable.addEventListener('click', function (event) {
  event.preventDefault();
  const targetClass = event.target.getAttribute('class');
  const targetParentClass = event.target.parentElement.getAttribute('class');
  if (targetClass === 'discardAllBtn') {
    axios.delete(`${apiUrl}${apiPath}/carts`)
      .then(function (response) {
        cartsData = response.data;
        renderCartsList(cartsData);
      })
      .catch(function (error) {
        if (error.response.status === 400) {
          alert('購物車內已經沒有商品了喔！')
        }
      });
  } else if (targetParentClass === 'discardBtn') {
    let cartId = event.target.parentElement.dataset.id;
    axios.delete(`${apiUrl}${apiPath}/carts/${cartId}`)
      .then(function (response) {
        cartsData = response.data;
        renderCartsList(cartsData);
      })
      .catch(function (error) {
        console.log(error);
      });
  };
});

// 手機和email資料驗證設置
const customerPhone = document.querySelector('#customerPhone');
const orderInfoMessagePhone = document.querySelector('.orderInfo-message[data-message="電話"]');
customerPhone.addEventListener('blur', function() {
    if (validatePhone(customerPhone.value) === false) {
        orderInfoMessagePhone.textContent = '請輸入正確的手機格式';
        orderInfoMessagePhone.style.display = 'block';
    } else {
        orderInfoMessagePhone.style.display = 'none';
    };
});

const customerEmail = document.querySelector('#customerEmail');
const orderInfoMessageEmail = document.querySelector('.orderInfo-message[data-message="Email"]');
customerEmail.addEventListener('blur', function () {
  if (validateEmail(customerEmail.value) === false) {
    orderInfoMessageEmail.textContent = '請輸入正確的email格式';
    orderInfoMessageEmail.style.display = 'block';
  } else {
    orderInfoMessageEmail.style.display = 'none';
  };
});

// 串接送出預定資料
const orderInfoBtn = document.querySelector('.orderInfo-btn');
orderInfoBtn.addEventListener('click', sentOrder);
function sentOrder(event) {
  if (cartsData.carts.length == 0) {
    alert('請選擇至少一項產品');
    return;
  };
  // 資料元素
  const orderInfoForm = document.querySelector('.orderInfo-form');
  event.preventDefault();
  const customerName = document.querySelector('#customerName');
  const customerAddress = document.querySelector('#customerAddress');
  const tradeWay = document.querySelector('#tradeWay');
  const orderInfoMessageName = document.querySelector('.orderInfo-message[data-message="姓名"]');
  const orderInfoMessageAddress = document.querySelector('.orderInfo-message[data-message="寄送地址"]');
  if (customerName.value === '') {
    orderInfoMessageName.style.display = 'block';
  } else {
    orderInfoMessageName.style.display = 'none';
  };
  if (customerPhone.value === '') {
    orderInfoMessagePhone.textContent = '必填';
    orderInfoMessagePhone.style.display = 'block';
  } else {
    orderInfoMessagePhone.style.display = 'none';
  }
  if (customerEmail.value === '') {
    orderInfoMessageEmail.textContent = '必填';
    orderInfoMessageEmail.style.display = 'block';
  } else {
    orderInfoMessageEmail.style.display = 'none';
  };
  if (customerAddress.value === '') {
    orderInfoMessageAddress.style.display = 'block';
  } else {
    orderInfoMessageAddress.style.display = 'none';
  };
  if (tradeWay.value === '') {
    alert('請選擇交易方式！');
  };
  if (customerName.value === '' || customerPhone.value === '' || customerEmail.value === '' || customerAddress.value === '' || tradeWay.value === '') {
    return;
  };
  // 收集預定資料
  let orderObject = {
    "data": {
      "user": {
        "name": customerName.value,
        "tel": customerPhone.value,
        "email": customerEmail.value,
        "address": customerAddress.value,
        "payment": tradeWay.value,
      },
    },
  };
  // 建立訂單
  axios.post(`${apiUrl}${apiPath}/orders`, orderObject)
    .then(function (response) {
      if (response.data.status === true) {
        orderInfoForm.reset();
        alert('訂單建立成功');
        shoppingCartTableTbody.innerHTML = '';
        totalPriceDom.innerHTML = `NT$${0}`;
      };
    })
    .catch(function (error) {
      console.log(error);
    });
};

// 千位數轉換
function toThousands(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// email 驗證
function validateEmail(mail) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
      return true;
    } else {
      return false;
    }
}
// 手機 驗證
function validatePhone(phone) {
    if (/^(09)[0-9]{8}$/.test(phone)) {
      return true;
    } else {
      return false;
    }
}