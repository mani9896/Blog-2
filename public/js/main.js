const socket = io();
const addImage = document.getElementById("compose");
const images = document.querySelector(".images");
socket.on("image", function () {
  var div = document.createElement("div");
  console.log("ghvvgh");
  div.classList.add("img");
  div.innerHTML =
    '    <input type="text" name="height" /><input type="text" name="width" />   <input type="file" id="image" name="image" value="" />';
  document.querySelector(".images").appendChild(div);
});
addImage.addEventListener("submit", function (e) {
  e.preventDefault();
  socket.emit("add");
});
