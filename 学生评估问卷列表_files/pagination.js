//pageConditions
var pageConditions = "";

function pagination(containerid, pageSizeVal, nowPage, totalNum, method, allowScrollLoading, divPagerid, message) {
    if (allowScrollLoading == undefined || allowScrollLoading == "" || allowScrollLoading == null) {
        allowScrollLoading = "off";
    }
    var parr = (pageSizeVal + "").split("_");
    var pageSize = parseInt(parr[0]);
    nowPage = parseInt(nowPage);
    totalNum = parseInt(totalNum);
    //获取分页控件父节点
    var container = $("#" + containerid);
    //分页控件html
    var pageContent = "";
    if (totalNum > 0 && totalNum) {
        $("#" + divPagerid).css("display", "");
        //总页数
        var totalPage = totalNum % pageSize == 0 ? totalNum / pageSize : parseInt(totalNum / pageSize) + 1;
        //记录从
        var recFrom = "";
        //记录到
        var recTo = "";

        recFrom = (nowPage - 1) * pageSize + 1;
        if (nowPage == totalPage) {
            recTo = totalNum;
        } else {
            recTo = nowPage * pageSize;
        }

        pageContent += "<div class='dataTables_paginate paging_simple_numbers' id='sample-table-2_paginate_" + containerid + "' style='position:relative;'>";
        pageContent += "<div id='div_page_loading_" + containerid + "' style='z-index:19900516;position:absolute;left:0;top:-2px;width:100%;text-align:center;border-radius:5px;display:none;'>" +
            "<img src='/img/icon/pageloading.gif' style='width:28px;height:28px;'></img>" +
            "</div>"
        pageContent += "<div style='display:inline-block;'>";
        pageContent += "<ul id='pagination_ul_" + containerid + "' class='pagination' style='position:relative;'>";
        pageContent += "<li id='li_page_" + (nowPage - 1) + "' class='paginate_button previous pagebarhand' aria-controls='sample-table-2' tabindex='0' name='sample-table-2_previous' onclick='turntopage(this," + method + "," + divPagerid + ");return false;'>";
        pageContent += "<span style='padding:3px 7px;'>&lt;上一页</span>";
        pageContent += "</li>";


        if (totalPage <= 7) {
            pageContent += pageCode(1, totalPage, method, divPagerid);
        } else {
            if (nowPage - 2 <= 3 && nowPage + 2 >= totalPage - 2) {
                pageContent += pageCode(1, totalPage, method, divPagerid);
            } else if (nowPage <= 3 && nowPage + 2 < totalPage - 2) {
                pageContent += pageCode(1, 5, method, divPagerid);
                pageContent += noCode();
                pageContent += pageCode(totalPage - 1, totalPage, method, divPagerid);
            } else if (nowPage - 2 <= 3 && nowPage + 2 < totalPage - 2) {
                pageContent += pageCode(1, nowPage + 2, method, divPagerid);
                pageContent += noCode();
                pageContent += pageCode(totalPage - 1, totalPage, method, divPagerid);
            } else if (nowPage - 2 > 3 && nowPage >= totalPage - 1) {
                pageContent += pageCode(1, 2, method, divPagerid);
                pageContent += noCode();
                pageContent += pageCode(totalPage - 4, totalPage, method, divPagerid);
            } else if (nowPage - 2 > 3 && nowPage + 2 >= totalPage - 2) {
                pageContent += pageCode(1, 2, method, divPagerid);
                pageContent += noCode();
                pageContent += pageCode(nowPage - 2, totalPage, method, divPagerid);
            } else {
                pageContent += pageCode(1, 2, method, divPagerid);
                pageContent += noCode();
                pageContent += pageCode(nowPage - 2, nowPage + 2, method, divPagerid);
                pageContent += noCode();
                pageContent += pageCode(totalPage - 1, totalPage, method, divPagerid);
            }
        }

        pageContent += "<li id='li_page_" + (nowPage + 1) + "' class='paginate_button next pagebarhand' aria-controls='sample-table-2' tabindex='0' name='sample-table-2_next' onclick='turntopage(this," + method + "," + divPagerid + ");return false;'>";
        pageContent += "<span style='padding:3px 7px;'>下一页&gt;</span>";
        pageContent += "</li>";
        pageContent += "</ul>&nbsp;</div>";
        pageContent += "<div style='display:inline-block;vertical-align: top;position:relative;font-size:14px;color:#999999;'>" +
            "<span id='span_page_txt_" + containerid + "'>转到</span><span style='position:relative;width:42px;height:26px;'>" +
            "<input id='turnpageto_" + containerid + "' type='text' value='" + nowPage + "' onfocus='turnpagetoFocus(\"" + containerid + "\");' onblur='turnpagetoBlur(\"" + containerid + "\");' style='position:relative;height:26px;width:40px;display:inline-block;line-height:100% !important;font-size:12px;'/>" +
            "<input type='button' value='确定' id='btn_turnpageto_" + containerid + "' class='btn btn-primary btn-xs' onclick='turntopage(this," + method + "," + divPagerid + ");' style='position:absolute;left:42px;display:none;'/>" +
            "</span>页 | " +
            "共<span id='totalPage_show_" + containerid + "'>" + totalPage + "</span>页 | ";

        var pSizeSelectWidth = "40px";
        if (allowScrollLoading == "on") pSizeSelectWidth = "75px";
        pageContent += "每页显示<select id='pagination_pageSize_" + containerid + "' value='' onchange='turntopage(this," + method + "," + divPagerid + ")' style='position:relative;height:26px;width:" + pSizeSelectWidth + ";line-height:100% !important;padding:0;font-size:12px;'>";

        if (allowScrollLoading == "on") pageContent += "<option id='page_sl_" + containerid + "' value='30_sl' >滚动加载</option>";
        pageContent += "<option value='10'>10</option><option value='20'>20</option><option value='30'>30</option><option value='50'>50</option></select>条| " +
            "当前显示第";

        if (totalNum == 1) {
            pageContent += recFrom;
        } else {
            pageContent += recFrom + "~" + recTo;
        }
        pageContent += "条，共" + totalNum + "条</div>";
        pageContent += "</div>";
        //填充控件
        $(container).html(pageContent);

        //设置滚动加载选中
        if ($("#pagination_pageSize_" + containerid).find("option[value=" + pageSizeVal + "]").length != 1) {
            $("#page_sl_" + containerid).val(pageSizeVal);
        }
        $("#pagination_pageSize_" + containerid).val(pageSizeVal);

        //设置滚动加载方法
        if ((pageSizeVal + "").indexOf("_sl") != -1 && nowPage == 1) {
            /*$(window).scroll(function() {
             var scrollTH = $(window).scrollTop();
             var winH = $(window).height();
             var docH = $(document).height();

             if(docH-winH==scrollTH){
             var turnpagetoObj = $("#btn_turnpageto");
             turntopage(turnpagetoObj[0],method);
             }
             });*/
            $("#" + divPagerid).unbind("scroll");
            $("#" + divPagerid).scroll(function () {
                var scrollHeightD = this.scrollHeight;
                var scrollTopD = this.scrollTop;
                var clientHeightD = this.clientHeight;
                if (scrollTopD != 0) {
                    if (scrollHeightD - scrollTopD == clientHeightD || scrollHeightD - scrollTopD < clientHeightD + 1) {
                        var turnpagetoObj = $("#btn_turnpageto_" + containerid);
                        turntopage(turnpagetoObj[0], method, divPagerid);
                    }
                }
            });
        } else if ((pageSizeVal + "").indexOf("_sl") == 1) {
            $("#" + divPagerid).unbind('scroll');
        }

        setPageBarStatus(nowPage, totalPage, containerid);
    } else {
        var svg = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="170px" height="170px" viewBox="0 0 200 200" enable-background="new 0 0 200 200" xml:space="preserve" p-id="422"><g p-id="423"><path fill="#EEEEEE" d="M18.224,35.559c0,0,0.38-0.042,0.592,0.211s0.465,3.804,1.395,4.776s4.692,0.423,4.692,1.691\
		c0,1.014-3.496,1.124-4.68,2.096c-1.184,0.972-0.507,5.072-1.957,4.921c-1.135-0.119-0.338-3.381-1.733-4.692\
		s-4.776-1.057-4.776-2.24s3.466-0.465,4.65-1.818C17.59,39.152,17.083,35.559,18.224,35.559z" p-id="424"></path><path fill="#B1AFAE" d="M7.726,77.11c0,0,0.23-0.026,0.357,0.128c0.128,0.153,0.281,2.296,0.842,2.883s2.832,0.255,2.832,1.02\
		c0,0.612-2.11,0.678-2.824,1.265c-0.714,0.587-0.306,3.061-1.181,2.97c-0.685-0.072-0.204-2.041-1.046-2.832\
		c-0.842-0.791-2.883-0.638-2.883-1.352s2.092-0.281,2.806-1.097C7.343,79.279,7.037,77.11,7.726,77.11z" p-id="425"></path><path fill="#EEEEEE" d="M190.447,56.933c0,0,0.261-0.029,0.406,0.145s0.319,2.608,0.956,3.274c0.637,0.666,3.216,0.29,3.216,1.159\
		c0,0.695-2.396,0.77-3.208,1.437c-0.811,0.666-0.348,3.477-1.341,3.373c-0.778-0.081-0.232-2.318-1.188-3.216\
		c-0.956-0.898-3.274-0.724-3.274-1.536s2.376-0.319,3.187-1.246C190.013,59.396,189.665,56.933,190.447,56.933z" p-id="426"></path><path fill="#B1AFAE" d="M154.66,25.617c0,0,0.261-0.029,0.406,0.145c0.145,0.174,0.319,2.608,0.956,3.274\
		c0.637,0.666,3.216,0.29,3.216,1.159c0,0.695-2.396,0.77-3.208,1.437c-0.811,0.666-0.348,3.477-1.341,3.373\
		c-0.778-0.081-0.232-2.318-1.188-3.216c-0.956-0.898-3.274-0.724-3.274-1.536s2.376-0.319,3.187-1.246\
		C154.226,28.08,153.878,25.617,154.66,25.617z" p-id="427"></path><circle fill="#EEEEEE" cx="56.234" cy="19.989" r="3.79" p-id="428"></circle><circle fill="#EEEEEE" cx="178.362" cy="75.509" r="2.376" p-id="429"></circle></g><circle fill="#EEEEEE" cx="95.662" cy="104.843" r="77.333" p-id="430"></circle><path fill="#FDFDFD" d="M145.856,131.98c-0.023,3.196-2.633,5.769-5.829,5.746l-89.136-0.146c-3.196-0.023-5.769-2.633-5.746-5.829\
		l0.431-56.782c0.023-3.196,2.633-5.769,5.829-5.746l72.81,0.029c5.893,5.294,13.625,12.765,21.971,19.869L145.856,131.98z" p-id="431"></path><path fill="#D8D8D8" d="M146.469,87.616c-0.026,1.112-0.949,1.992-2.061,1.966l-19.059-0.448c-1.112-0.026-1.992-0.949-1.966-2.061\
		l0.381-16.217c0.026-1.112,0.949-1.992,2.061-1.966L146.469,87.616z" p-id="432"></path><circle fill="#EEEEEE" cx="117.299" cy="128.428" r="18.247" p-id="433"></circle><path fill="#FFFFFF" d="M117.412,148.245c2.241,0,4.352-0.653,6.209-1.801l-0.006-2.304c0,0-0.31-3.921-3.169-4.83\
		c-0.044-0.014-0.76,0.77-2.055,0.699l-0.831-0.262c-0.085,0.004-0.178,0.127-0.262,0.131c-0.085-0.004-0.395-0.433-0.481-0.437\
		l-0.437,0.219c-1.294,0.071-2.054-0.403-2.098-0.389c-2.859,0.909-3.073,4.869-3.073,4.869l-0.006,2.304\
		C113.06,147.592,115.171,148.245,117.412,148.245z" p-id="434"></path><path fill="#FFFFFF" d="M126.565,131.668c-0.091-4.974-4.313-8.929-9.431-8.836c-5.117,0.094-9.192,4.202-9.1,9.175\
		c0.059,3.23,1.95,6.365,4.669,8.141l9.773-0.179c2.294-1.693,3.83-4.47,4.06-7.374C126.561,132.288,126.57,131.978,126.565,131.668z\
		M121.961,139.026l-9.001,0.165c-2.103-1.47-3.536-3.873-3.581-6.347c-0.074-4.03,3.384-7.361,7.723-7.441\
		c4.339-0.08,7.917,3.123,7.991,7.153C125.137,135.032,123.914,137.482,121.961,139.026z" p-id="435"></path><path fill="#B1AFAE" d="M113.09,139.511l8.674-0.159c1.881-1.543,3.058-3.992,3.013-6.467c-0.074-4.029-3.523-7.233-7.705-7.157\
		c-4.181,0.077-7.511,3.405-7.437,7.434C109.68,135.636,111.063,138.04,113.09,139.511z" p-id="436"></path><linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="213.0032" y1="105.5631" x2="213.0032" y2="105.5631" gradientTransform="matrix(0.9989 0.0478 -0.0478 0.9989 -99.1255 22.5725)" p-id="437"><stop offset="0.2225" style="stop-color:#FFFFFF" p-id="438"></stop><stop offset="1" style="stop-color:#D1D3D4" p-id="439"></stop></linearGradient><path fill="url(#SVGID_1_)" d="M108.588,138.199" p-id="440"></path><path fill="#B1AFAE" d="M122.101,140.456c-1.196,0.936-3.021,0.947-4.737,0.969c-1.752,0.023-3.397,0.04-4.644-0.756\
		c-0.398-0.254-0.581-0.843-0.41-0.847l10.184-0.231C122.665,139.587,122.402,140.221,122.101,140.456z" p-id="441"></path><path fill="#C8C7C6" d="M109.59,133.167c-0.074-4.049,3.268-7.393,7.465-7.47c4.197-0.077,7.659,3.143,7.734,7.191\
		c0.03,1.624-0.464,3.237-1.336,4.592c1.06-1.425,1.672-3.18,1.639-4.947c-0.074-4.049-3.665-7.267-8.02-7.187\
		c-4.355,0.08-7.826,3.427-7.752,7.477c0.027,1.493,0.558,2.96,1.434,4.214C110.041,135.862,109.615,134.525,109.59,133.167z" p-id="442"></path><path fill="#FFFFFF" d="M122.199,140.266c-1.218,0.535-3.07,0.508-4.805,0.538c-1.771,0.031-3.424,0.109-4.676-0.323\
		c-0.399-0.138-0.578-0.465-0.406-0.469l10.293-0.234C122.778,139.775,122.506,140.132,122.199,140.266z" p-id="443"></path><linearGradient id="SVGID_2_" gradientUnits="userSpaceOnUse" x1="221.3779" y1="106.4216" x2="221.3779" y2="106.4216" gradientTransform="matrix(0.9989 0.0478 -0.0478 0.9989 -99.1255 22.5725)" p-id="444"><stop offset="0.2225" style="stop-color:#FFFFFF" p-id="445"></stop><stop offset="1" style="stop-color:#D1D3D4" p-id="446"></stop></linearGradient><path fill="url(#SVGID_2_)" d="M116.912,139.457" p-id="447"></path><path fill="#C1C1C1" d="M122.63,139.791c0,0.241-0.196,0.437-0.437,0.437h-9.617c-0.241,0-0.437-0.196-0.437-0.437l0,0\
		c0-0.241,0.196-0.437,0.437-0.437h9.617C122.434,139.354,122.63,139.549,122.63,139.791L122.63,139.791z" p-id="448"></path><path fill="#B1AFAE" d="M119.922,145.551c0,0.108-0.088,0.196-0.196,0.196l-4.626,0.003c-0.108,0-0.196-0.088-0.196-0.196\
		l-0.002-3.131c0-0.108,0.088-0.196,0.196-0.196l4.626-0.003c0.108,0,0.196,0.088,0.196,0.196L119.922,145.551z" p-id="449"></path><path fill="#CCCCCC" d="M119.374,145.166c0,0.082-0.069,0.148-0.153,0.148l-3.616,0.002c-0.085,0-0.154-0.066-0.154-0.148\
		l-0.001-2.36c0-0.082,0.069-0.148,0.153-0.148l3.616-0.002c0.085,0,0.154,0.066,0.154,0.148L119.374,145.166z" p-id="450"></path><rect x="115.894" y="143.119" fill="#FFFFFF" width="1.315" height="0.527" p-id="451"></rect><rect x="117.613" y="143.118" fill="#FFFFFF" width="1.315" height="0.527" p-id="452"></rect><rect x="115.895" y="144.042" fill="#FFFFFF" width="3.034" height="0.813" p-id="453"></rect><g p-id="454"><path fill="#D8D8D8" d="M111.976,131.974c-0.82-0.543,0.176-2.081,1.023-2.932s1.519-1.188,2.189-1.014\
		c0.469,0.122,1.102,1.168-0.015,2.077C113.919,131.126,113.369,132.898,111.976,131.974z" p-id="455"></path><circle fill="#D8D8D8" cx="111.865" cy="133.908" r="0.962" p-id="456"></circle></g><path fill="#D8D8D8" d="M112.247,85.099c0,1.057-0.857,1.913-1.913,1.913H59.158c-1.057,0-1.913-0.857-1.913-1.913l0,0\
		c0-1.057,0.857-1.913,1.913-1.913h51.175C111.39,83.186,112.247,84.042,112.247,85.099L112.247,85.099z" p-id="457"></path><path fill="#D8D8D8" d="M83.201,98.717c0,1.057-0.857,1.913-1.913,1.913H59.158c-1.057,0-1.913-0.857-1.913-1.913l0,0\
		c0-1.057,0.857-1.913,1.913-1.913h22.129C82.344,96.804,83.201,97.66,83.201,98.717L83.201,98.717z" p-id="458"></path><path fill="#D8D8D8" d="M83.201,112.335c0,1.057-0.857,1.913-1.913,1.913H59.158c-1.057,0-1.913-0.857-1.913-1.913l0,0\
		c0-1.057,0.857-1.913,1.913-1.913h22.129C82.344,110.422,83.201,111.278,83.201,112.335L83.201,112.335z" p-id="459"></path><path fill="#D8D8D8" d="M141.451,148.653c-0.669-0.798-1.858-0.902-2.656-0.234l-0.003,0.003l-2.983-3.559\
		c3.835-4.361,6.162-10.08,6.162-16.344c0-13.675-11.086-24.76-24.76-24.76c-13.675,0-24.76,11.086-24.76,24.76\
		c0,13.675,11.086,24.76,24.76,24.76c5.177,0,9.983-1.59,13.957-4.307l2.876,3.43l-0.003,0.003c-0.798,0.669-0.902,1.858-0.234,2.656\
		l9.153,10.918c2.63-2.047,5.132-4.249,7.475-6.612L141.451,148.653z M117.149,146.768c-10.078,0-18.247-8.17-18.247-18.248\
		c0-10.078,8.17-18.247,18.247-18.247c10.078,0,18.248,8.17,18.248,18.247C135.397,138.598,127.227,146.768,117.149,146.768z" p-id="460"></path></svg>';
        //pageContent += 	"<div style='text-align:right;color:#CC0017;font-size:14px;'>未查询到相关记录集！</div>";
        if (message == "" || message == null || message == undefined) {
            message = "<div style='text-align: center;'>" + svg + "<br><font>暂时木有内容呀~~</font></div>";
        } else {
            message = "<div style='text-align: center;'>" + svg + "<br><font>" + message + "</font></div>";
        }
        $("#" + divPagerid).css("display", "none");
        //填充控件
        $(container).html(message);
    }
}

//拼装页码
function pageCode(from, to, method, divPagerid) {
    var content = "";
    for (var i = from; i <= to; i++) {
        content += "<li id='li_page_" + i + "' class='paginate_button pagebarhand' aria-controls='sample-table-2' tabindex='0' onclick='turntopage(this," + method + "," + divPagerid + ");return false;'>";
        content += "<span style='padding:3px 7px;'>" + i + "</span>";
        content += "</li>";
    }

    return content;
}

//拼接省略页码
function noCode() {
    var content = "";
    content += "<li class='paginate_button disabled' aria-controls='sample-table-2' tabindex='0'>";
    content += "<span style='padding:3px 7px;'>...</span>";
    content += "</li>";

    return content;
}

//跳页输入框得到失去焦点事件
function turnpagetoFocus(containerid) {
    $("#btn_turnpageto_" + containerid).css("display", "inline-block");
    $("#btn_turnpageto_" + containerid).css("left", "40px");
}

function turnpagetoBlur(containerid) {
    setTimeout(function () {
        $("#btn_turnpageto_" + containerid).css("display", "none");
        $("#btn_turnpageto_" + containerid).css("left", "0px");
    }, 500);
}

//跳页
function turntopage(obj, getDate, divPagerid) {
    if (typeof(divPagerid) == 'object') {
        divPagerid = $(divPagerid).attr("id");
    }
    if (typeof(divPagerid) == 'string') {
    }
    var containerid = $("#" + divPagerid).siblings("div[id^=urppagebar]").attr("id");
    var num = $("#turnpageto_" + containerid).val();
    var reg = new RegExp("^[0-9]*$");
    if (num == "" || num == null) {
        urp.alert("请输入数字!");
    } else if (!reg.test(num)) {
        urp.alert("请输入数字!");
    } else {
        var clickPage = "";
        var pageSizeVal = $("#pagination_pageSize_" + containerid).val();
        if (obj.id == "btn_turnpageto_" + containerid) {
            clickPage = parseInt($("#turnpageto_" + containerid).val());
            if ((pageSizeVal + "").indexOf("_sl") != -1) {
                clickPage = clickPage + 1;
            }
        } else if (obj.id == "pagination_pageSize_" + containerid) {
            clickPage = 1;
            if ((pageSizeVal + "").indexOf("_sl") != -1) {
                //进行滚动加载
                $("#pagination_ul_" + containerid).css("display", "none");
                $("#turnpageto_" + containerid).attr("readOnly", true);
                $("#turnpageto_" + containerid).removeAttr("onfocus");
                $("#span_page_txt_" + containerid).text("第");
                $("#turnpageto_" + containerid).val("0");
                /*$(window).scroll(function() {
                 var scrollTH = $(window).scrollTop();
                 var winH = $(window).height();
                 var docH = $(document).height();

                 if(docH-winH==scrollTH){
                 var turnpagetoObj = $("#btn_turnpageto");
                 turntopage(turnpagetoObj[0],getDate);
                 }
                 });*/
                $("#" + divPagerid).unbind("scroll");
                $("#" + divPagerid).scroll(function () {
                    var scrollHeightD = this.scrollHeight;
                    var scrollTopD = this.scrollTop;
                    var clientHeightD = this.clientHeight;
                    if (scrollTopD != 0) {
                        if (scrollHeightD - scrollTopD == clientHeightD || scrollHeightD - scrollTopD < clientHeightD + 1) {
                            var turnpagetoObj = $("#btn_turnpageto_" + containerid);
                            turntopage(turnpagetoObj[0], getDate, divPagerid);
                        }
                    }
                });

            } else {
                if ($("#pagination_ul_" + containerid).css("display") == "none") {
                    $("#pagination_ul_" + containerid).css("display", "inline-block");
                    $("#turnpageto_" + containerid).attr("readOnly", false);
                    $("#turnpageto_" + containerid).attr("onfocus", "turnpagetoFocus();");
                    $("#span_page_txt_" + containerid).text("转到");
                    $("#" + divPagerid).unbind('scroll');
                }
            }
        } else {
            var idarr = obj.id.split("_");
            clickPage = parseInt(idarr[2]);
        }

        var totalPage = parseInt($("#totalPage_show_" + containerid).text());
        if ((pageSizeVal + "").indexOf("_sl") != -1 && clickPage != 1 && clickPage > totalPage) {
            urp.alert("数据已加载完！");
            return;
        }

        if (clickPage < 1) {
            clickPage = 1;
        } else if (clickPage > totalPage) {
            clickPage = totalPage;
        }

        $("#div_page_loading_" + containerid).show();
        getDate(clickPage, pageSizeVal);
    }
}

//设置分页状态
function setPageBarStatus(nowPage, totalPage, containerid) {
    $("#li_page_" + nowPage).addClass("active");
    $("#li_page_" + nowPage).removeAttr("onclick");
    if (nowPage == 1) {
        $("li[name=sample-table-2_previous]").addClass("disabled");
        $("li[name=sample-table-2_previous]").removeClass("pagebarhand");
        $("li[name=sample-table-2_previous]").removeAttr("onclick");
    }
    if (nowPage == totalPage) {
        $("li[name=sample-table-2_next]").addClass("disabled");
        $("li[name=sample-table-2_next]").removeClass("pagebarhand");
        $("li[name=sample-table-2_next]").removeAttr("onclick");
    }
    var pageSizeVal = $("#pagination_pageSize_" + containerid).val();
    if ((pageSizeVal + "").indexOf("_sl") != -1) {
        //进行滚动加载
        $("#pagination_ul_" + containerid).css("display", "none");
        $("#turnpageto_" + containerid).attr("readOnly", true);
        $("#turnpageto_" + containerid).removeAttr("onfocus");
        $("#span_page_txt_" + containerid).text("第");
    } else {
        if ($("#pagination_ul_" + containerid).css("display") == "none") {
            $("#pagination_ul_" + containerid).css("display", "inline-block");
            $("#turnpageto_" + containerid).attr("readOnly", false);
            $("#turnpageto_" + containerid).attr("onfocus", "turnpagetoFocus();");
            $("#span_page_txt_" + containerid).text("转到");
        }
    }
    if (nowPage != 1) {
        urp.alert("第 " + nowPage + " 页， 共 " + totalPage + " 页");
    }

}