import React from "react";
import "./Loader.css";

function ProductLoader() {
  return (
    <div className="vendor-card">
      <div className="img-container-loader">
        <div className="product-img-loader" />
      </div>
      <div className="vendor-card-details">
        <p className="loader-item vendor-name-loader"></p>
        <p className="loader-item vendor-rating-loader"></p>
      </div>
      <div className="vendor-card-action">
        <button className="buy-prod" />
      </div>
    </div>
  );
}

const ProductList = () => {
  return [1, 2, 3, 4, 5, 6, 7].map((item: number, index: number) => (
    <ProductLoader key={index} />
  ));
};

export const Loader1 = () => {
  return (
    <div className="loader-main-container">
      <div className="loader-container">
        <div className="product-page-list">{ProductList()}</div>
      </div>
    </div>
  );
};

export const Loader2 = () => {
  return (
    <div className="loader-main-container">
      <div className="main-chat-container">
        <div className="chat-container">
          <h2 className="chat-heading">Chat</h2>
          <div className="message-container">
            <p className="message sent loader-item" />
            <p className="message message1 received loader-item" />
            <p className="message message1 sent loader-item" />
            <p className="message message1 received loader-item" />
            <p className="message message1 sent loader-item" />
            <p className="message message1 received loader-item" />
            <p className="message message1 sent loader-item" />
            <p className="message message1 received loader-item" />
            <p className="message message1 sent loader-item" />
            <p className="message message1 sent loader-item" />
            <p className="message message1 received loader-item" />
            <p className="message message1 sent loader-item" />
            <p className="message received loader-item" />
          </div>
        </div>
        <div className="chat-input-container">
          <input
            disabled={false}
            placeholder="Type message..."
            className="chat-input"
          />

          <button disabled={true} className="chat-send">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export const Loader3 = () => {
  return (
    <div className="user-list-container">
      <h3>Connections </h3>
      {[0, 1, 2, 3, 4, 5]?.map((user: number) => (
        <button
          key={user}
          onClick={() => {}}
          disabled={true}
          className="user-list-item"
        >
          {" "}
        </button>
      ))}
    </div>
  );
};

export default function Loader() {
  return (
    <div className="loader-main-container">
      <div className="product-filters" />
      <div className="loader-container">
        <div className="product-page-list">{ProductList()}</div>
      </div>
    </div>
  );
}
