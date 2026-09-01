import { QRCodeSVG } from "qrcode.react";

const cardTemplates = {
  member: "/manus-storage/premier-member-card-platinum-dynamic_3a6a8b62.png",
  loyalty: "/manus-storage/pba-loyalty-dynamic-template-v2_171891aa.png",
};

function firstName(value?: string | null) {
  return value?.trim().split(/\s+/)[0] || "Parent";
}

export function MembershipCard({
  parentName,
  studentName,
  memberId,
  qrPayload,
  isLoyalty,
}: {
  parentName?: string | null;
  studentName: string;
  memberId: string;
  qrPayload?: string | null;
  isLoyalty: boolean;
}) {
  const parentFirstName = firstName(parentName);
  const studentFirstName = firstName(studentName);
  const accent = isLoyalty ? "text-[#dcb36b]" : "text-[#edaeb9]";
  return (
    <div className="relative mx-auto aspect-[3/2] w-full max-w-[520px] overflow-hidden rounded-[1.7rem] shadow-[0_24px_60px_rgba(0,0,0,.32)]">
      <img
        src={isLoyalty ? cardTemplates.loyalty : cardTemplates.member}
        alt="Premier Ballet Academy membership card design"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute left-[8%] top-[42%] max-w-[38%] text-left text-white">
        <p className={`text-[7px] font-medium tracking-[.21em] ${accent}`}>
          PARENT NAME
        </p>
        <p className="mt-1 truncate font-serif text-[clamp(14px,3.1vw,25px)] leading-none tracking-[.025em]">
          {parentFirstName}
        </p>
        <p
          className={`mt-[9%] text-[7px] font-medium tracking-[.21em] ${accent}`}
        >
          STUDENT NAME
        </p>
        <p className="mt-1 truncate font-serif text-[clamp(14px,3.1vw,25px)] leading-none tracking-[.025em]">
          {studentFirstName}
        </p>
        <p
          className={`mt-[9%] text-[7px] font-medium tracking-[.21em] ${accent}`}
        >
          MEMBER ID #
        </p>
        <p
          className={`mt-1 truncate font-serif text-[clamp(11px,2.4vw,19px)] leading-none tracking-[.06em] ${isLoyalty ? "text-[#dcb36b]" : "text-[#edaeb9]"}`}
        >
          {memberId}
        </p>
      </div>
      {qrPayload ? (
        <div className="absolute bottom-[7%] left-[52%] rounded-lg bg-white p-1.5 shadow-md">
          <QRCodeSVG
            value={qrPayload}
            size={42}
            bgColor="#FFFFFF"
            fgColor="#171215"
          />
        </div>
      ) : null}
    </div>
  );
}
