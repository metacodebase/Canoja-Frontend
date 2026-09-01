import ConsumerExplore from "./consumer/ConsumerExplore";
import OperatorLayout from "./OperatorLayout";

const OperatorExplore = () => <OperatorLayout mainClassName="operator-main--explore">{({ theme }) => <ConsumerExplore embedded themeOverride={theme} />}</OperatorLayout>;

export default OperatorExplore;
