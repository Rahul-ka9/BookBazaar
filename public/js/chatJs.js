const socket = io();
const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");

// Retrieve the username and bookId from the URL query parameters
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get("username");
const bookId = urlParams.get("bookId");
let roomId = "ABCD";
let loggedInUser = "ABCD";
let loggedInUserId = "BCD";

// console.log("username:", username);
// console.log("bookId:", bookId);

let fromUser = "John";
let toUser = "Maria";

async function chatExecute() {
  // console.log("start");
  try {
    const response = await fetch("/get-user");
    const data = await response.json();

    if (data.user) {
      loggedInUserId = data.user._id;
      loggedInUser = data.user.name;
      fromUser = loggedInUser;
      toUser = username;
      roomId = `${loggedInUserId}+${bookId}`;
      // console.log("loggedInUser:", loggedInUser);
      // console.log("loggedInUserId:", loggedInUserId);
      // console.log("roomId:", roomId);
      // console.log("fromUser:", fromUser);
      // console.log("toUser:", toUser);
      // console.log("username:", username);
      socket.emit("userDetails", { fromUser, toUser, bookId });
      // if (toUser == fromUser) {
      //   alert("NOOO");
      //   return;
      // }
    } else {
      console.error("User is not logged in");
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
  }
}

//Submit message
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // chatExecute();
  const msg = e.target.elements.msg.value;
  if (!msg) return;

  // console.log("message:", msg);
  final = {
    fromUser: fromUser,
    toUser: toUser,
    msg: msg,
    bookId: bookId,
  };
  // **** pending
  // console.log("here12");
  socket.emit("chatMessage", final); //emits chat message along with sender and reciever to server
  // console.log("here22");
  document.getElementById("msg").value = " ";
  // chatExecute();
});

// socket.on("output", (data) => {
//   console.log("here1111");
//   console.log(data);
// });

socket.on("output", (data) => {
  // console.log("DATAAA");
  // console.log(data);
  //recieves the entire chat history upon logging in between two users and displays them
  for (var i = 0; i < data.length; i++) {
    outputMessage(data[i]);
  }
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("message", (data) => {
  //recieves a message and displays it
  outputMessage(data);
  // console.log(data);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  // location.reload();
});

function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.from}<span> ${message.time}, ${message.date}</span></p>
    <p class ="text">
        ${message.message}
    </p>`;
  document.querySelector(".chat-messages").appendChild(div);
}

document.addEventListener("DOMContentLoaded", function (event) {
  chatExecute();
});