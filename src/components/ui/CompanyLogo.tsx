import Image from "next/image";

type Props = {
  size?: "sm" | "lg";
};

export default function CompanyLogo({ size = "sm" }: Props) {
  const logoSize = size === "lg" ? 96 : 56;

  return (
    <div className={`flex items-center gap-3 ${size === "lg" ? "flex-col" : ""}`}>
      <Image
        src="/logo.png"
        alt="주식회사 원엔지니어링"
        width={logoSize}
        height={logoSize}
        priority
        className="object-contain rounded-full"
      />
      <div className={`flex flex-col ${size === "lg" ? "items-center gap-0.5" : "gap-0"}`}>
        <span
          className={`font-bold tracking-tight text-slate-800 leading-tight
            ${size === "lg" ? "text-xl" : "text-sm"}`}
        >
          주식회사 원엔지니어링
        </span>
        <span
          className={`text-slate-500 font-medium
            ${size === "lg" ? "text-xs" : "text-[10px]"}`}
        >
          안전교육 · 전자서명 관리 시스템
        </span>
      </div>
    </div>
  );
}
