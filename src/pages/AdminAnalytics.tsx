import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart3,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  UserCheck,
  Clock,
  CheckCircle2
} from "lucide-react";

export default function AdminAnalytics() {
  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      change: "+12.5%",
      icon: Users,
      description: "Active platform users"
    },
    {
      title: "Total Orders",
      value: "856",
      change: "+8.3%",
      icon: FileText,
      description: "Orders this month"
    },
    {
      title: "Revenue",
      value: "$45,231",
      change: "+15.2%",
      icon: DollarSign,
      description: "Total platform revenue"
    },
    {
      title: "Active Writers",
      value: "342",
      change: "+5.7%",
      icon: UserCheck,
      description: "Verified writers"
    },
    {
      title: "Avg. Completion Time",
      value: "3.2 days",
      change: "-0.5 days",
      icon: Clock,
      description: "Average order completion"
    },
    {
      title: "Success Rate",
      value: "94.5%",
      change: "+2.1%",
      icon: CheckCircle2,
      description: "Orders completed successfully"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform performance metrics and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-600 font-medium flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change}
                </span>
                <span className="text-muted-foreground">from last month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Trends</CardTitle>
            <CardDescription>Monthly order volume over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Chart visualization will be displayed here</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
            <CardDescription>Platform revenue over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Chart visualization will be displayed here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
