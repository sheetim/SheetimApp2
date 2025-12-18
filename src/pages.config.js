import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Savings from './pages/Savings';
import Debts from './pages/Debts';
import Investments from './pages/Investments';
import Inflation from './pages/Inflation';
import NetWorth from './pages/NetWorth';
import Retirement from './pages/Retirement';
import Forecast from './pages/Forecast';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import FinancialAdvisor from './pages/FinancialAdvisor';
import Subscription from './pages/Subscription';
import BillingHistory from './pages/BillingHistory';
import OpenBanking from './pages/OpenBanking';
import Landing from './pages/Landing';
import Dividends from './pages/Dividends';
import UserSettings from './pages/UserSettings';
import Terms from './pages/Terms';
import AIInsights from './pages/AIInsights';
import Subscriptions from './pages/Subscriptions';
import CashFlow from './pages/CashFlow';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Transactions": Transactions,
    "Budgets": Budgets,
    "Savings": Savings,
    "Debts": Debts,
    "Investments": Investments,
    "Inflation": Inflation,
    "NetWorth": NetWorth,
    "Retirement": Retirement,
    "Forecast": Forecast,
    "Reports": Reports,
    "Settings": Settings,
    "FinancialAdvisor": FinancialAdvisor,
    "Subscription": Subscription,
    "BillingHistory": BillingHistory,
    "OpenBanking": OpenBanking,
    "Landing": Landing,
    "Dividends": Dividends,
    "UserSettings": UserSettings,
    "Terms": Terms,
    "AIInsights": AIInsights,
    "Subscriptions": Subscriptions,
    "CashFlow": CashFlow,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};