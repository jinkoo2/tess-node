var api_url = "http://localhost:3333/api/v1";
var token = "eyJhbGciOiJIUzI1NiJ9.amlua29vMkBnbWFpbC5jb20.qtAwDYl4NYNVuxAjYpzqGNfzCRfdq6VvUEdQ2s7kaXM";

window.onload = () => {
    // get supported language list
    get_lang_list();

    // on submit
    document.getElementById('myform').addEventListener('submit', onSubmit, false);
}

function get_lang_list() {
    // get lang list & polulate the drop down
    var url = `${api_url}/ocr/lang_list?token=${token}`
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.addEventListener("load", e => {

        console.log('request complete');
        console.log('status', xhr.status);
        console.log('statusText', xhr.statusText);

        var data = JSON.parse(xhr.response);
        console.log('data', data)
        console.log('type', typeof (data))
        // console.log('array(data)', new Array(data))
        // console.log('type array(data)', typeof (new Array(data)))

        var lang_select = document.getElementById("lang")
        lang_select.innerHTML = "";
        data.forEach(item => {
            lang_select.innerHTML += `<option value="${item.code}">${item.code} - ${item.label}</option>`
        })


        console.log('event', e)
    });
    xhr.addEventListener("error", e => {
        console.log('request failed', e)
    });
    xhr.addEventListener("abort", e => {
        console.log("request cancelled!")
    });

    xhr.send();

    console.log('get lang list sent!')
}

function _(id) {
    return document.getElementById(id)
}

function onSubmit(ev) {

    ev.preventDefault();
    console.log('onSubmit()')

    // ext
    var file_input = document.getElementById("img_data")
    const ext = file_input.value.split('.').pop()
    console.log('file_input.value.split(.).pop()', ext)


    var formData = new FormData(document.getElementById("myform"))
    formData.append("token", token);
    formData.append("img_ext", ext);

    var url = api_url + "/ocr";

    console.log('POST', url)

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    xhr.onreadystatechange = function () { // Call a function when the state changes.
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            console.log('request complete');
            console.log('status', xhr.status);
            console.log('statusText', xhr.statusText);

            var data = JSON.parse(xhr.response);
            console.log('data', data)
            _("output_text").innerHTML = data.text;
            _("output_json").innerHTML = JSON.stringify(data.json);
        }
    }

    xhr.send(formData);

    console.log('req sent!')



}



function ocr() {

    var formData = new FormData();
    formData.append("img_data", fileToUpload);
    formData.append("lang", "eng");
    formData.append("token", "Your-API-Key-Here");
    formData.append("isOverlayRequired", True);

    console.log(formData)
}