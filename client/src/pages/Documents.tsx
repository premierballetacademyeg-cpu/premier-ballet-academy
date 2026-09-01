import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  parentPolicyDocumentUrl,
  parentPolicyVersion,
} from "@/components/ParentPolicyDialog";
import { ExternalLink, FileText, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

const message = `Premier Ballet Academy — School Policies and Guidelines (${parentPolicyVersion})\n\nEvery Parent / Guardian must read and accept this policy before registration or profile confirmation.\n\nOpen the approved policy document: ${parentPolicyDocumentUrl}`;

export default function Documents() {
  const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  const copyLink = async () => {
    await navigator.clipboard.writeText(parentPolicyDocumentUrl);
    toast.success("Approved policy link copied.");
  };
  return (
    <div className="mx-auto max-w-5xl space-y-6 fade-up">
      <section>
        <p className="eyebrow">Official documents</p>
        <h1 className="section-title mt-1">Documents & WhatsApp Sharing</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#7b666c]">
          Open or share the approved Academy policy directly from the workspace.
          WhatsApp opens separately, where staff choose the recipient or group
          before sending.
        </p>
      </section>
      <article className="soft-card overflow-hidden rounded-[1.65rem]">
        <div className="grid md:grid-cols-[.75fr_1.25fr]">
          <div className="flex min-h-56 flex-col justify-between bg-[#7c3f52] p-7 text-white">
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/15">
                <FileText className="h-6 w-6" />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[.17em] text-[#f4dce1]">
                Premier Ballet Academy
              </p>
              <h2 className="mt-2 font-serif text-3xl leading-tight">
                School Policies & Guidelines
              </h2>
            </div>
            <Badge className="w-fit bg-[#f7e4ea] text-[#68404d]">
              Parent policy · {parentPolicyVersion}
            </Badge>
          </div>
          <div className="p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl text-[#302126]">
                  Approved Parent Policy
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#79656c]">
                  The required policy for new registrations and current-parent
                  profile confirmations, including season, fees, payment window,
                  Loyalty Program, and uniform requirements.
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-[#dcbdae] text-[#7c3f52]"
              >
                DOCX · approved
              </Badge>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                asChild
                className="rounded-xl bg-[#7c3f52] hover:bg-[#693344]"
              >
                <a
                  href={parentPolicyDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open policy
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-[#dcbdae] text-[#7c3f52]"
              >
                <a href={shareUrl} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Share via WhatsApp
                </a>
              </Button>
              <Button
                variant="ghost"
                onClick={copyLink}
                className="rounded-xl text-[#785967]"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Copy link
              </Button>
            </div>
            <p className="mt-4 text-xs text-[#a08a91]">
              For WhatsApp groups, select the desired group manually after
              WhatsApp opens.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
