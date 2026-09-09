import ConsumerExplore from "./consumer/ConsumerExplore";
import OperatorLayout from "./OperatorLayout";
import { useBusinessDashboard } from "../services/business";

const OperatorExplore = () => {
  const { data } = useBusinessDashboard();
  const canViewSpotlight = ["starter", "pro"].includes(data?.data?.plan_tier);

  return <OperatorLayout mainClassName="operator-main--explore">{({ theme }) => <ConsumerExplore embedded themeOverride={theme} showSpotlight={canViewSpotlight} />}</OperatorLayout>;
};

export default OperatorExplore;
