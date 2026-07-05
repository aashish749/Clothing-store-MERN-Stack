import React, { useState } from "react";
import Title from "../components/Title";
import NewsLetterBox from "../components/NewsLetterBox";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const onSubmitHandler = (event) => {
    event.preventDefault();
    (async () => {
      try {
        const apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";
        const resp = await fetch(`${apiBaseUrl}/api/contact/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, subject, message }),
        });

        const data = await resp.json();
        if (resp.ok && data.success) {
          setStatusMessage("Message sent. We will get back to you soon.");
          setName("");
          setEmail("");
          setSubject("");
          setMessage("");
        } else {
          setStatusMessage(data.message || "Failed to send message");
        }
      } catch (err) {
        console.error("Contact send failed:", err);
        setStatusMessage("Failed to send message. Try again later.");
      }
    })();
  };

  return (
    <div>
      <hr className="container text-gray-200 mb-8" />
      <Title text1={"CONTACT"} text2={"US"} />
      <div className="mx-auto mt-10 w-full max-w-[980px] px-4 grid grid-cols-1 md:grid-cols-[1fr_0.9fr] gap-6 lg:gap-8 items-start">
        <div className="w-full">
          <div className="inline-flex items-center gap-2 mb-5">
            <p className="prata-regular text-2xl">Send Message</p>
            <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
          </div>

          <form
            onSubmit={onSubmitHandler}
            className="w-full flex flex-col gap-4"
          >
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-800"
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-800"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-800"
              placeholder="Subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              required
            />

            <textarea
              className="w-full px-3 py-2 border border-gray-800 min-h-[130px] resize-y"
              placeholder="Message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
            />

            {statusMessage ? (
              <p className="text-sm text-green-700">{statusMessage}</p>
            ) : null}

            <button className="bg-black text-white font-light px-8 py-2 mt-2 max-w-36 hover:bg-black/80 transition-colors duration-300">
              Send
            </button>
          </form>
        </div>

        <div className="w-full flex flex-col gap-4 justify-start md:pt-1">
          <h3 className="text-md font-bold">Our Store</h3>
          <p className="text-gray-500">
            54709 Willms Station Suite 350, Washington, USA
          </p>
          <p className="text-gray-500">Tel: (415) 555-0132</p>
          <h3 className="text-md font-bold">Careers at Forever</h3>
          <p className="text-gray-500">
            Learn more about teams and job openings.
          </p>
          <button className="py-3.5 max-w-37 px-5 border">Explore Jobs</button>
        </div>
      </div>
      <NewsLetterBox></NewsLetterBox>
    </div>
  );
};

export default Contact;
