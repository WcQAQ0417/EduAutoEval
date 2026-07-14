var c_color = new Array();
var c_kcmcolor = new Array();
var c_jxlcolor = new Array();
var c_kch = new Array();

for (var i = 0; i < 20; i++) {
    var tn = i + 1;
    c_color[i] = "div-kcb-" + tn;
}

for (var i = 0; i < 5; i++) {
    var tn = i + 1;
    c_kcmcolor[i] = "p-kcm-" + tn;
}

for (var i = 0; i < 5; i++) {
    var tn = i + 1;
    c_jxlcolor[i] = "p-jxl-" + tn;
}

function CourseColor() {
};

function getDivColorClass(kch) {
    for (var i = 0; i < c_kch.length; i++) {
        if (kch == c_kch[i]) {
            return c_color[i] + "," + getKcmColorClass(i) + "," + getJxlColorClass(i);
        }
    }

    var pos = c_kch.length % 20;
    c_kch[pos] = kch;
    return c_color[pos] + "," + getKcmColorClass(pos) + "," + getJxlColorClass(pos);
}

function getKcmColorClass(n) {
    var yn = (n + 1) % 5;
    if (yn == 0) {
        yn = 5;
    }
    return c_kcmcolor[yn - 1];
}

function getJxlColorClass(n) {
    var yn = (n + 1) % 5;
    if (yn == 0) {
        yn = 5;
    }
    return c_jxlcolor[yn - 1];
}

function initArrays() {
    c_kch.length = 0;
}

CourseColor.prototype = {
    "getDivColorClass": getDivColorClass,
    "getKcmColorClass": getKcmColorClass,
    "getJxlColorClass": getJxlColorClass,
    "initArrays": initArrays
};

colorClass = new CourseColor();
