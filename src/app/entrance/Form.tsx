"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import { generateQrCode } from "../../utils/generateQrCode";
import { CustomButton } from "../../components/CustomComponents";
import { fetcher } from "../../requests/requests";
import { apiUrl } from "@/src/variables/variables";

export const EntranceForm = () => {
  const [enteredToEvent, setEnteredToEvent] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [message, setMessage] = useState(null);
  const searchParams = useSearchParams();
  const [enteredEmail, setEnteredEmail] = useState("");
  const [qrCode, setQrCode] = useState("");
  const onEmailChange = (e) => setEnteredEmail(e.target.value);
  const contractAddress = searchParams.get("contractAddress");

  const onSubmit = async () => {
    try {
      const res = await fetcher(`${apiUrl}/entrance/notify`, {
        method: "POST",
        body: JSON.stringify({
          enteredEmail,
          contractAddress,
        }),
      });
      if (res?.error) {
        setErrorMessage(res.error);
        toast(`Something went wrong: ${res.error}`, { type: "error" });
        return;
      }
      if (res?.message && !res?.txHash) {
        setMessage(res.message);
        toast(res.message, { type: "warning" });
        setEnteredToEvent(true);
      } else {
        const isLocalhost = window?.location?.hostname === "localhost";
        await fetcher(`/entrance/notify`, {
          method: "POST",
          body: JSON.stringify({
            contractAddress,
            isLocalhost,
            userData: res.userData,
          }),
        });
        setMessage(res.message);
        toast("Successfully entered", { type: "success" });
        setEnteredToEvent(true);
      }
      setEnteredEmail("");
    } catch (e) {
      console.log(e);
      toast(`Something went wrong: ${e?.message}`, { type: "error" });
    }
  };

  const generateQrCodeForContract = async () => {
    const mobileDomain = process.env.NEXT_PUBLIC_MOBILE_BASE_URL;
    const qr = await generateQrCode(
      `http://${mobileDomain}/entrance?contractAddress=0x73a4a17ebe1fe23652d0b7b03a5a7759b6eb7649d2a8e61da02755fe6cab771`,
    );
    setQrCode(qr);
    return;
  };
  useEffect(() => {
    if (!qrCode) {
      generateQrCodeForContract();
    }
  }, []);

  return (
    <div className="flex w-full h-[100vh] items-center justify-center">
      {enteredToEvent && <p className="text-green-500">{message}</p>}
      {!!errorMessage && <p className="text-red-500">{errorMessage}</p>}
      {!!contractAddress && !enteredToEvent && !errorMessage && (
        <div className="flex flex-col gap-2">
          <p>Enter email to join the event</p>
          <input
            onChange={onEmailChange}
            value={enteredEmail}
            type={"email"}
            placeholder={"Enter email"}
          />
          <CustomButton onClick={onSubmit}>Submit</CustomButton>
        </div>
      )}
      {!contractAddress && qrCode && (
        <Image src={qrCode} alt={"qr"} width={200} height={200} />
      )}
    </div>
  );
};
