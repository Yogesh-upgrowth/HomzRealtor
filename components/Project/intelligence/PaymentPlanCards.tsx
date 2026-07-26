import { getPaymentPlans } from "@/lib/intelligence/paymentPlans";

type Props = {
  slug: string;
};

const PaymentPlanCards = ({ slug }: Props) => {
  const plans = getPaymentPlans(slug);
  if (plans.length === 0) return null;

  return (
    <div>
      <p className="mb-4 text-lg font-bold text-white">Payment plans</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.id}
            className="rounded-[20px] border border-white/[0.07] bg-[#141416] p-5 transition-colors hover:border-[#D9B268]/35"
          >
            <div className="mb-3.5 flex items-center justify-between gap-2">
              <span className="text-[15.5px] font-bold text-white">{p.name}</span>
              {p.tag && (
                <span className="shrink-0 whitespace-nowrap rounded-full border border-[#D9B268]/25 bg-[#D9B268]/12 px-2.5 py-1 text-[11px] font-bold text-[#D9B268]">
                  {p.tag}
                </span>
              )}
            </div>
            <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full bg-gradient-to-r from-[#F2D79B] to-[#C99A4B]"
                style={{ width: `${Math.min(100, p.upfrontPct)}%` }}
              />
            </div>
            <p className="mb-3 text-[12.5px] text-gray-500">split {p.splitLabel}</p>
            <p className="text-[13.5px] leading-relaxed text-gray-400">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentPlanCards;
