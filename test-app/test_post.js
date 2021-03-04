$(document).ready(function () {

    var form = document.forms.namedItem("fileinfo");
    form.addEventListener('submit', function (ev) {

        

        var divOutput = document.querySelector("div")

        var formData = new FormData(form);
        formData.append("token", "eyJhbGciOiJIUzI1NiJ9.amlua29vMkBnbWFpbC5jb20.qtAwDYl4NYNVuxAjYpzqGNfzCRfdq6VvUEdQ2s7kaXM");
        formData.append("lang", "eng");
        formData.append("img_ext", "tif");

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:3333/api/v1/ocr", true);

        xhr.onreadystatechange = function () { // Call a function when the state changes.
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                divOutput.innerHTML = "finished!"// Request finished. Do processing here.
                console.log(this)
            }
        }

        xhr.send(formData);

        console.log('req sent!')

        ev.preventDefault();

    }, false);


});

function ocr() {

    var formData = new FormData();
    formData.append("img_data", fileToUpload);
    formData.append("lang", "eng");
    formData.append("token", "Your-API-Key-Here");
    formData.append("isOverlayRequired", True);

    console.log(formData)
}