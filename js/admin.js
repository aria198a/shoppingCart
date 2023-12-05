// 共用變數
let ordersData = [];
let tokenKeyObj = {
  headers: {
    'Authorization': token,
  }
};
const orderPageTableTbody = document.querySelector('.orderPage-table-tbody');
function init() {
  getOrdersList();
};
init();
// 渲染 後台圖表
function renderC3(data) {
  // 1. 全產品類別營收比重
  // 1-1. 資料處理
  let categoryObj = {};
  data.forEach(function (element) {
    element.products.forEach(function (item) {
      if (categoryObj[item.category] === undefined) {
        categoryObj[item.category] = item.quantity * item.price;
      } else {
        categoryObj[item.category] += item.quantity * item.price;
      }
    });
  });
  let categoryArray = [];
  let categoryObjKeys = Object.keys(categoryObj);
  categoryObjKeys.forEach(function (element) {
    let ary = [];
    ary.push(element);
    ary.push(categoryObj[element]);
    categoryArray.push(ary);
  });
  let sorted = categoryArray.sort((a, b) => b[1] - a[1]);
  // 1-2. C3.js
  let chart = c3.generate({
    bindto: '#chart', // HTML 元素綁定
    data: {
      type: "pie",
      columns: sorted,
    },
    color: {
      pattern: ['#5434A7', '#9D7FEA', '#DACBFF', '#301E5F']
    },
  });
  // 2. 全品項營收比重
  // 2-1. 資料處理
  let productsObject = {};
  data.forEach(function (element) {
    element.products.forEach(function (element) {
      if (productsObject[element.title] === undefined) {
        productsObject[element.title] = element.price * element.quantity;
      } else {
        productsObject[element.title] += element.price * element.quantity;
      };
    });
  });
  let productsArray = [];
  let productsObjectKeys = Object.keys(productsObject);
  productsObjectKeys.forEach(function (element) {
    let ary = [];
    ary.push(element);
    ary.push(productsObject[element]);
    productsArray.push(ary);
  });
  let sortedProducts = productsArray.sort((a, b) => b[1] - a[1]);
  // 如果超過四筆以上，就統整為其他
  if (sortedProducts.length > 3) {
    let deleteLength = sortedProducts.length - 3;
    let othersProductsPrice = 0;
    for (let i = 3; i < sortedProducts.length; i++) {
      othersProductsPrice += sortedProducts[i][1];
    }
    sortedProducts.splice(3, deleteLength, ['其他', othersProductsPrice]);
  }
  let colors = ['#301E5F', '#5434A7', '#9D7FEA', '#DACBFF'];
  let chart2Colors = {};
  sortedProducts.forEach(function (element, index) {
    chart2Colors[element[0]] = colors[index];
  });
  // 2-2. C3.js
  let chart2 = c3.generate({
    bindto: '#chart2', // HTML 元素綁定
    data: {
      type: "pie",
      columns: sortedProducts,
      colors: chart2Colors,
    },
  });
};
// axios 取得訂單列表
function getOrdersList() {
  // 不太懂此tokenKeyObj格式，跟文件寫的不一樣
  axios.get(`${apiAdminUrl}${apiPath}/orders`, tokenKeyObj)
    .then(function (response) {
      ordersData = response.data.orders;
      renderOrdersList(ordersData);
    })
    .catch(function (error) {
      console.log(error);
    });
};
// 渲染訂單列表
function renderOrdersList(data) {
  // 一起更新圖表狀態
  renderC3(data);
  let str = '';
  data.forEach(function (element) {
    // 組產品內容字串
    let products = '';
    element.products.forEach(function (item) {
      let content = `<p>${item.title}x${item.quantity}</p>`;
      products += content;
    });
    // 判斷訂單狀態
    let status = '';
    if (element.paid) {
      status = '已處理';
    } else {
      status = '未處理';
    }
    let tr = `<tr>
              <td>${element.id}</td>
              <td>
                <p>${element.user.name}</p>
                <p>${element.user.tel}</p>
              </td>
              <td>${element.user.address}</td>
              <td>${element.user.email}</td>
              <td>
                ${products}
              </td>
              <td>${unixTimestamp(element.createdAt)}</td>
              <td>
                <a class="orderStatus" href="#" data-id="${element.id}" data-status="${element.paid}">${status}</a>
              </td>
              <td>
                <input type="button" class="delSingleOrder-Btn" value="刪除" data-id="${element.id}">
              </td>
            </tr>`;
    str += tr;
  });
  orderPageTableTbody.innerHTML = str;
};
// table-tbody-點擊事件監聽
orderPageTableTbody.addEventListener('click', function (event) {
  event.preventDefault();
  let orderStatus = event.target.dataset.status;
  let orderId = event.target.dataset.id;
  if (event.target.getAttribute('class') === 'delSingleOrder-Btn') {
    deleteOrder(orderId);
  } else if (event.target.getAttribute('class') === 'orderStatus') {
    putOrderStatus(orderStatus, orderId);
  };
});
// axios 修改訂單狀態
function putOrderStatus(status, id) {
  let newStatus;
  if (status == 'true') {
    newStatus = false;
  } else {
    newStatus = true;
  };
  let statusObj = {
    "data": {
      "id": id,
      "paid": newStatus,
    },
  };
  axios.put(`${apiAdminUrl}${apiPath}/orders`, statusObj, tokenKeyObj)
    .then(function (response) {
      if(response.data.message){
        alert(response.data.message);
      };
      ordersData = response.data.orders;
      renderOrdersList(ordersData);
    })
    .catch(function (error) {
      console.log(error);
    });
};

// axios 刪除單一筆訂單
function deleteOrder(id) {
    axios.delete(`${apiAdminUrl}${apiPath}/orders/${id}`, tokenKeyObj)
      .then(function (response) {
        ordersData = response.data.orders;
        renderOrdersList(ordersData);
      })
      .catch(function (error) {
        if (error.response.status === 400) {
          alert('找不到該筆訂單，無法執行刪除動作')
        }
      });
}

// axios 刪除所有訂單
const discardAllBtn = document.querySelector('.discardAllBtn');
discardAllBtn.addEventListener('click', function(event) {
    event.preventDefault();
    if (ordersData.length === 0) {
        alert('目前訂單列表沒有任何東西');
        return;
    };
    axios.delete(`${apiAdminUrl}${apiPath}/orders`, tokenKeyObj)
      .then(function (response) {
        ordersData = response.data.orders;
        renderOrdersList(ordersData);
      })
      .catch(function (error) {
        if (error.response.status === 400) {
            alert('無任何訂單，無法執行刪除動作');
          };
      });
})

// 日期轉換器
function unixTimestamp(timestamp) {
  let date = new Date(timestamp * 1000);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};