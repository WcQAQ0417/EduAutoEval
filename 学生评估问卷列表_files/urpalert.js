function Urp() {
};

Urp.prototype = {
    "alert": urpAlert,
    "confirm": urpConfirm,
    "pagebar": pagination,
    "translationWeek": translationWeek,
    "mergeSession": mergeSession,
    "html2jspprint": html2jspprint,
    "keyDo": keyDo,
    "arrayIntersection": arrayIntersection,
    "addModelHt": addModelHt

};

function urpAlert(msg, callback) {
    layer.msg(msg);
    if (typeof callback === 'function') {
        setTimeout(callback, 1000);
    }
};

function urpConfirm(msg, callback) {
    layer.confirm(
        msg,
        {btn: ['确定', '取消'], closeBtn: 0, title: "提示信息"},
        function () {
            if (typeof callback === 'function') {
                layer.closeAll('dialog');
                callback(true);
            }
        },
        function () {
            if (typeof callback === 'function') {
                callback(false);
            }
        }
    );
};

/*!
 * 翻译星期，小写数字翻译成大写
 * 1 --> 一
 */
function translationWeek(week) {
    if (week == null || week == "") {
        return "";
    }
    var weeks = new Array("", "一", "二", "三", "四", "五", "六", "日");
    return weeks[week];

}

/*!
 * 合并节次和持续节次
 * 3 2 --> 3-4节
 */
function mergeSession(session, num) {
    var sessionName;
    sessionName = session;
    if (num != null && Number(num) > 1) {
        sessionName += "-" + (Number(session) + Number(num) - 1) + "节";
    }
    return sessionName;
}

/*!
 *
 * 根据id将元素转换为图片，并打印
 * id 要打印内容区域的id
 * callback 打印之后的回调函数，用于恢复页面
 */
function html2jspprint(id, callback) {

    var shareContent = document.querySelector("#" + id);
    var width = shareContent.offsetWidth;
    var height = shareContent.offsetHeight;
    var canvas = document.createElement("canvas");
    var scale = 2;

    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.getContext("2d").scale(scale, scale);
    var opts = {
        scale: scale,
        canvas: canvas,
        logging: true,
        width: width,
        height: height
    };

    html2canvas(shareContent, opts).then(function (canvas) {

        canvas.id = "mycanvas";
        var dataUrl = canvas.toDataURL();
        var newImg = document.createElement("img");
        newImg.src = dataUrl;
        var dvHt = $("#page-content-template").html();
        $("#page-content-template").html('<img style="width: 100%;" src="' + newImg.src + '" />');

        newImg.onload = function () {
            window.print();
            $("#page-content-template").html(dvHt);
            callback.call(this);
        };
    });
}
/*
 *
 * 两个数组取交集
 */
function arrayIntersection(a, b) {
    var ai = 0, bi = 0;
    var result = new Array();
    while (ai < a.length && bi < b.length) {
        if (a[ai] < b[bi]) {
            ai++;
        }
        else if (a[ai] > b[bi]) {
            bi++;
        }
        else /* they're equal */
        {
            result.push(a[ai]);
            ai++;
            bi++;
        }
    }
    return result;
}

//添加一个用于显示模态框的代码
function addModelHt(id, wid) {

    var modal = '<div class="modal fade" id="' + (id == undefined ? 'modal-' + new Date().getTime() : id) + '">\
                    <div class="modal-dialog" style="width: ' + (wid == undefined ? '80%' : wid) + ';" >\
                        <div class="modal-content">\
                        <div class="center">\
                            <img src="/img/icon/pageloading.gif" style="width:28px;height:28px;"></img>\
                        </div>\
                    </div>\
                </div>';
    var modal = $(modal).appendTo('body');
    return modal;
}

/**
 * ztree 树上的查询
 * @param inputid 输入框的id
 * @param treeid  树的id
 * @param labelid 用于显示所有结果的labelid
 * @returns {string}
 */
function keyDo(inputid, treeid, labelid) {
    var lastValue = "", nodeList = [];
    var key = $("#" + inputid);
    key.on("focus", focusKey)
        .on("blur", blurKey)
        .on("keyup", doSearch);

    function callNumber(nodes) {
        var zTree = $.fn.zTree.getZTreeObj(treeid);
        if (nodes.length) {
            zTree.selectNode(nodes[0], false);
            document.getElementById(inputid).focus();
            clickCount = 0; //防止重新输入的搜索信息的时候，没有清空上一次记录
            var num = clickCount + 1;
            document.getElementById(labelid).innerHTML = "[" + num + "/" + nodes.length + "]";
        } else if (nodes.length == 0) {
            document.getElementById(labelid).innerHTML = "[0/0]";
            zTree.cancelSelectedNode(); //取消焦点
        }
        if (document.getElementById(inputid).value == "") {
            document.getElementById(labelid).innerHTML = "";
            zTree.cancelSelectedNode();
        }
    }

    function doSearch(event) {
        if (event.keyCode == 13) {
            searchNode(event);
            return false;
        }
    }

    function focusKey(e) {
        if (key.hasClass("empty")) {
            key.removeClass("empty");
        }
    }

    function blurKey(e) {
        if (key.get(0).value === "") {
            key.addClass("empty");
        }
        searchNode(event);
    }

    //搜索节点
    function searchNode(e) {
        var zTree = $.fn.zTree.getZTreeObj(treeid);
        var value = $.trim(key.get(0).value);
        var keyType = "title";
        if (key.hasClass("empty")) {
            value = "";
        }
        if (lastValue === value) return;
        lastValue = value;
        var allNodes = zTree.transformToArray(zTree.getNodes());
        updateNodes(zTree, allNodes, false);
        if (value === "") {
            document.getElementById(labelid).innerHTML = "";
            return;
        }
        ;
        nodeList = zTree.getNodesByParamFuzzy(keyType, value); //调用ztree的模糊查询功能，得到符合条件的节点
        updateNodes(zTree, nodeList, true);
        callNumber(nodeList);
    }

    //高亮显示被搜索到的节点
    function updateNodes(treeObj, nodes, highlight) {
        for (var i = 0, l = nodes.length; i < l; i++) {
            nodes[i].highlight = highlight; //高亮显示搜索到的节点(highlight是自己设置的一个属性)
            if (highlight) {
                treeObj.expandNode(nodes[i].getParentNode(), true);
            }
            treeObj.updateNode(nodes[i]); //更新节点数据，主要用于该节点显示属性的更新
        }
    }

    //点击向上按钮时，将焦点移向上一条数据
    $("#" + inputid).closest('div').find("i.clickUp").unbind("click").click(function () {
        var zTree = $.fn.zTree.getZTreeObj(treeid);
        var total = nodeList.length - 1;
        if (nodeList.length == 0) {
            urp.alert("没有搜索结果！");
            return;
        } else if (clickCount == 0) {
            urp.alert("您已位于第一条记录上！");
            return;
        } else {
            clickCount--;
            zTree.selectNode(nodeList[clickCount], false);
        }
        document.getElementById(inputid).focus();
        num = clickCount + 1;
        document.getElementById(labelid).innerHTML = "[" + num + "/" + nodeList.length + "]";
    });
    //点击向下按钮时，将焦点移向下一条数据
    $("#" + inputid).closest('div').find("i.clickDown").unbind("click").click(function () {
        var zTree = $.fn.zTree.getZTreeObj(treeid);
        var total = nodeList.length - 1;
        if (nodeList.length == 0) {
            urp.alert("没有搜索结果！");
            return;
        } else if (total == clickCount) {
            urp.alert("您已位于最后一条记录上！")
            return;
        } else {
            clickCount++;
            zTree.selectNode(nodeList[clickCount], false)
        }
        document.getElementById(inputid).focus();
        num = clickCount + 1;
        document.getElementById(labelid).innerHTML = "[" + num + "/" + nodeList.length + "]";
    })
}

urp = new Urp();