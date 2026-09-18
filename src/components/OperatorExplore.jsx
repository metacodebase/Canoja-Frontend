import ConsumerExplore from "./consumer/ConsumerExplore";
import OperatorLayout from "./OperatorLayout";

const OperatorExplore = () => {
  return <OperatorLayout mainClassName="operator-main--explore">{({ theme }) => <ConsumerExplore embedded themeOverride={theme} />}</OperatorLayout>;
};

export default OperatorExplore;
