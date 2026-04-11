import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, Users, DollarSign, Wrench, PlusCircle, Search, ChevronRight, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(142 76% 36%)", "hsl(0 84% 60%)", "hsl(262 83% 58%)", "hsl(38 92% 50%)"];

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 border border-white/20 shadow-2xl rounded-xl z-50">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color || entry.fill }}>
            {entry.name}: {typeof entry.value === 'number' && entry.name.toLowerCase().includes('cost') ? `₦${entry.value.toLocaleString()}` : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id");
      if (error) throw error;
      return data;
    },
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("id, sale_price, sale_date");
      if (error) throw error;
      return data;
    },
  });

  const { data: repairs = [] } = useQuery({
    queryKey: ["repairs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("repairs").select("id, repair_cost, created_at");
      if (error) throw error;
      return data;
    },
  });

  const totalRevenue = sales.reduce((s, r) => s + Number(r.sale_price || 0), 0);

  // Condition breakdown for pie chart
  const pieData = useMemo(() => {
    const conditionCounts = vehicles.reduce((acc, v) => {
      const c = (v as any).condition || "Used";
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(conditionCounts).map(([name, value]) => ({ name, value }));
  }, [vehicles]);

  // Vehicles added per month (last 6 months)
  const monthlyData = useMemo(() => {
    const months: { name: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("default", { month: "short" });
      const y = d.getFullYear();
      const m = d.getMonth();
      const count = vehicles.filter((v) => {
        const cd = new Date(v.created_at);
        return cd.getFullYear() === y && cd.getMonth() === m;
      }).length;
      months.push({ name: label, count });
    }
    return months;
  }, [vehicles]);

  // Repairs cost per month (last 6 months)
  const repairsMonthly = useMemo(() => {
    const months: { name: string; cost: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("default", { month: "short" });
      const y = d.getFullYear();
      const m = d.getMonth();
      const cost = repairs
        .filter((r) => {
          const cd = new Date(r.created_at);
          return cd.getFullYear() === y && cd.getMonth() === m;
        })
        .reduce((s, r) => s + Number(r.repair_cost || 0), 0);
      months.push({ name: label, cost });
    }
    return months;
  }, [repairs]);

  // Filtered vehicles for search
  const filteredVehicles = vehicles
    .filter((v) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.year.toString().includes(q) ||
        (v.vin && v.vin.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const currentDateInfo = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-up pb-10">
      {/* SVG Definitions for Charts */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
      </svg>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 opacity-80">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{currentDateInfo}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-foreground/70 tracking-tight">
            {greeting}!
          </h1>
          <p className="text-base text-muted-foreground mt-2 max-w-xl">
            Here's what's happening with your dealership today. Review your latest insights and recently added vehicles below.
          </p>
        </div>
        <Button asChild size="lg" className="rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all group shrink-0">
          <Link to="/vehicles/new">
            <PlusCircle className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" /> 
            Add Vehicle
          </Link>
        </Button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-max">
        
        {/* Main Revenue Card - Spans 2 columns */}
        <Link to="/sales" className="md:col-span-2 group">
          <div className="bento-card h-full p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative min-h-[160px]">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-3xl rounded-full pointer-events-none group-hover:bg-primary/30 transition-colors duration-500"></div>
            
            <div className="flex justify-between items-start z-10 relative">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" /> Latest
              </div>
            </div>
            
            <div className="mt-6 z-10 relative">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Revenue</p>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">₦{totalRevenue.toLocaleString()}</h2>
            </div>
          </div>
        </Link>

        {/* Small Stat 1 */}
        <Link to="/vehicles" className="group">
          <div className="bento-card h-full p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-sky-500/10 rounded-2xl group-hover:bg-sky-500/20 transition-colors">
                <Car className="h-6 w-6 text-sky-500" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold">{vehicles.length}</h3>
              <p className="text-sm text-muted-foreground font-medium mt-1">Total Vehicles</p>
            </div>
          </div>
        </Link>

        {/* Small Stat 2 */}
        <Link to="/customers" className="group">
          <div className="bento-card h-full p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-violet-500/10 rounded-2xl group-hover:bg-violet-500/20 transition-colors">
                <Users className="h-6 w-6 text-violet-500" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold">{customers.length}</h3>
              <p className="text-sm text-muted-foreground font-medium mt-1">Customers</p>
            </div>
          </div>
        </Link>

        {/* Repairs Cost Chart - Spans 2 columns */}
        <div className="bento-card md:col-span-2 p-6 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-6 z-10 relative">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" /> Repair Costs
              </h3>
              <p className="text-sm text-muted-foreground">Monthly expenditure (Last 6 months)</p>
            </div>
          </div>
          <div className="flex-1 min-h-0 w-full z-10 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repairsMonthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--foreground)/0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(value) => `₦${(value/1000)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--foreground)/0.05)'}} />
                <Bar dataKey="cost" fill="url(#colorCost)" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicles Added Chart - Spans 2 columns */}
        <div className="bento-card md:col-span-2 p-6 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-6 z-10 relative">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" /> Vehicles Added
              </h3>
              <p className="text-sm text-muted-foreground">Inventory growth (Last 6 months)</p>
            </div>
          </div>
          <div className="flex-1 min-h-0 w-full z-10 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--foreground)/0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--foreground)/0.05)'}} />
                <Bar dataKey="count" fill="url(#colorCount)" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Condition Pie Chart */}
        <div className="bento-card md:col-span-1 p-6 flex flex-col items-center justify-center min-h-[250px]">
          <h3 className="font-semibold text-sm self-start mb-2 w-full text-center sm:text-left">Vehicle Conditions</h3>
          {pieData.length > 0 ? (
            <div className="w-full h-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0)" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data</p>
          )}
        </div>

        {/* Recent Vehicles - Spans 3 columns */}
        <div className="glass-panel md:col-span-3 p-0 flex flex-col overflow-hidden bg-card/20 border-white/10 relative">
          {/* Header area with integrated search */}
          <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/40">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
               Recently Added
            </h3>
            <div className="relative w-full sm:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                className="pl-9 h-9 rounded-xl bg-background/50 border-white/10 focus-visible:ring-primary/50 transition-all font-medium text-sm"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="p-3">
            {filteredVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4 animate-pulse">
                  <Car className="h-8 w-8 text-primary" />
                </div>
                <p className="text-base text-foreground font-medium mb-1">
                  {search ? "No matches found" : "Your inventory is empty"}
                </p>
                <p className="text-sm text-muted-foreground mb-5 max-w-sm">
                  {search ? "Try adjusting your search terms." : "Start managing your fleet by adding your first vehicle today."}
                </p>
                {!search && (
                  <Button asChild size="sm" className="rounded-xl shadow-lg shadow-primary/20">
                    <Link to="/vehicles/new">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredVehicles.map((v) => (
                  <Link
                    key={v.id}
                    to={`/vehicles/${v.id}`}
                    className="flex items-center gap-4 rounded-xl p-3 sm:px-4 hover:bg-white/5 dark:hover:bg-white/5 transition-all group relative overflow-hidden border border-transparent hover:border-white/5"
                  >
                    <div className="absolute inset-x-0 h-full w-full bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                    <div className="bg-foreground/5 dark:bg-foreground/10 p-2.5 rounded-xl shrink-0 group-hover:bg-primary/10 transition-colors duration-300">
                      <Car className="h-4 w-4 text-foreground/70 group-hover:text-primary transition-colors duration-300" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {v.year} {v.make} {v.model}
                      </p>
                      {v.vin ? (
                         <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                            VIN: {v.vin}
                         </p>
                      ) : (
                         <p className="text-xs text-muted-foreground truncate opacity-0 group-hover:opacity-100 transition-opacity">View details</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                       <span className="block text-xs font-medium text-muted-foreground mb-0.5">
                         {new Date(v.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                       </span>
                       <span className="inline-flex items-center text-[10px] uppercase tracking-wider text-primary/80 font-bold opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                          View <ChevronRight className="h-3 w-3 ml-0.5" />
                       </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            {vehicles.length > 5 && (
              <div className="pt-3 pb-1 px-2 border-t border-white/5 mt-2 flex justify-center">
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground group rounded-lg text-xs font-semibold h-8">
                  <Link to="/vehicles">
                    View Complete Inventory
                    <ArrowUpRight className="ml-1.5 h-3.5 w-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
