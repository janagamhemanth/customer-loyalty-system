import React from 'react';
import { useEffect, useState } from "react";
import {
  Award, BarChart3, Gift, History, LogOut, Plus, ShieldCheck,
  ShoppingBag, Sparkles, Users, Wallet, RefreshCw, Trash2, Power, X
} from "lucide-react";
import { api } from "./api.js";

const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
const date = value => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [rewardForm, setRewardForm] = useState({ title: "", description: "", category: "Coupon", pointsCost: "50", imageUrl: "" });
  const [editingReward, setEditingReward] = useState(null);
  const [ruleForm, setRuleForm] = useState({ spendAmount: "100", pointsAwarded: "1", welcomeBonus: "20" });

  useEffect(() => {
    const storedUser = localStorage.getItem("loyalty_user");
    const token = localStorage.getItem("loyalty_token");
    if (storedUser && token) {
      try { setUser(JSON.parse(storedUser)); } catch { localStorage.clear(); }
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user?.id, user?.role, page]);

  async function loadData() {
    setError("");
    try {
      if (user?.role === "admin") {
        const [overview, rewards, customers] = await Promise.all([
          api("/admin/overview"), api("/admin/rewards"), api("/admin/customers")
        ]);
        setData({ ...overview, rewards: rewards.rewards, customers: customers.customers });
        setRuleForm({
          spendAmount: String(overview.rule.spendAmount),
          pointsAwarded: String(overview.rule.pointsAwarded),
          welcomeBonus: String(overview.rule.welcomeBonus)
        });
      } else {
        const result = await api("/customer/dashboard");
        setData(result);
      }
    } catch (err) { setError(err.message); }
  }

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await api(`/auth/${authMode}`, {
        method: "POST",
        body: JSON.stringify(form)
      });
      localStorage.setItem("loyalty_token", result.token);
      localStorage.setItem("loyalty_user", JSON.stringify(result.user));
      setUser(result.user);
      setPage("dashboard");
      setNotice(authMode === "register" ? "Account created. Your welcome points are ready!" : "Welcome back!");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  function logout() {
    localStorage.removeItem("loyalty_token");
    localStorage.removeItem("loyalty_user");
    setUser(null); setData(null); setPage("dashboard");
    setNotice("You have logged out.");
  }

  async function runAction(action, successMessage) {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await action();
      setNotice(result?.message || successMessage || "Changes saved.");
      await loadData();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function recordPurchase(event) {
    event.preventDefault();
    await runAction(() => api("/customer/purchase", {
      method: "POST", body: JSON.stringify({ amount: Number(purchaseAmount) })
    }), "Purchase recorded.");
    setPurchaseAmount("");
  }
  async function awardPoints(customerId, customerName) {
  const pointsInput = prompt(`How many points do you want to award to ${customerName}?`);

  if (pointsInput === null) return;

  const points = Number(pointsInput);

  if (!Number.isInteger(points) || points < 1 || points > 1000000) {
    alert("Please enter a valid whole number of points.");
    return;
  }

  const reason = prompt("Enter the reason for awarding points:");

  if (reason === null) return;

  if (!reason.trim()) {
    alert("Please enter a reason.");
    return;
  }

  await runAction(() => api(`/admin/customers/${customerId}/award-points`, {
    method: "POST",
    body: JSON.stringify({ points, reason: reason.trim() })
  }), "Points awarded successfully.");
}

  async function redeem(reward) {
    if (!window.confirm(`Redeem "${reward.title}" for ${reward.pointsCost} points?`)) return;
    await runAction(() => api(`/customer/redeem/${reward._id}`, { method: "POST" }));
  }async function saveReward(event) {
  event.preventDefault();

  const payload = {
    ...rewardForm,
    pointsCost: Number(rewardForm.pointsCost),
    imageUrl: rewardForm.imageUrl || ""
  };

  await runAction(() => api(editingReward ? `/admin/rewards/${editingReward}` : "/admin/rewards", {
    method: editingReward ? "PUT" : "POST",
    body: JSON.stringify(payload)
  }), editingReward ? "Reward updated." : "Reward created.");

  setRewardForm({
    title: "",
    description: "",
    category: "Coupon",
    pointsCost: "50",
    imageUrl: ""
  });

  setEditingReward(null);
}
function startEdit(reward) {
  setEditingReward(reward._id);
  setRewardForm({
    title: reward.title,
    description: reward.description || "",
    category: reward.category || "Coupon",
    pointsCost: String(reward.pointsCost),
    imageUrl: reward.imageUrl || ""
  });
  setPage("rewards");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

  async function toggleReward(reward) {
    await runAction(() => api(`/admin/rewards/${reward._id}`, {
      method: "PUT", body: JSON.stringify({ active: !reward.active })
    }), "Reward status updated.");
  }

  async function deleteReward(reward) {
    if (!window.confirm(`Delete "${reward.title}"?`)) return;
    await runAction(() => api(`/admin/rewards/${reward._id}`, { method: "DELETE" }));
  }

  async function saveRule(event) {
    event.preventDefault();
    await runAction(() => api("/admin/rule", {
      method: "PUT",
      body: JSON.stringify({
        spendAmount: Number(ruleForm.spendAmount),
        pointsAwarded: Number(ruleForm.pointsAwarded),
        welcomeBonus: Number(ruleForm.welcomeBonus)
      })
    }), "Reward rule updated.");
  }

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-visual">
          <div className="brand brand-light"><span className="brand-mark"><Sparkles size={21} /></span> LoyaltyLoop</div>
          <div className="auth-copy">
            <span className="eyebrow">LOYALTY, MADE SIMPLE</span>
            <h1>Every purchase<br />brings you <em>closer.</em></h1>
            <p>Earn points, discover rewards, and make every shopping moment count.</p>
            <div className="visual-points"><span><Award size={18} /> Earn points</span><span><Gift size={18} /> Unlock rewards</span></div>
          </div>
          <div className="visual-foot">A smarter way to reward loyalty.</div>
        </section>
        <section className="auth-panel">
          <div className="auth-form-wrap">
            <div className="mobile-brand brand"><span className="brand-mark"><Sparkles size={20} /></span> LoyaltyLoop</div>
            <span className="eyebrow">{authMode === "login" ? "WELCOME BACK" : "GET STARTED"}</span>
            <h2>{authMode === "login" ? "Sign in to your account" : "Create your account"}</h2>
            <p className="muted">{authMode === "login" ? "Your rewards are waiting for you." : "Join us and start earning points today."}</p>
            <form onSubmit={handleAuth} className="stack-form">
              {authMode === "register" && <label>Full name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter your name" /></label>}
              <label>Email address<input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
              <label>Password<input type="password" minLength="8" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" /></label>
              <button className="btn btn-primary btn-wide" disabled={busy}>{busy ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}</button>
            </form>
            <p className="auth-switch">{authMode === "login" ? "New to LoyaltyLoop?" : "Already have an account?"} <button onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setError(""); }}>{authMode === "login" ? "Create an account" : "Sign in"}</button></p>
            {error && <div className="alert alert-error">{error}</div>}
            {notice && <div className="alert alert-success">{notice}</div>}
            <div className="auth-note"><ShieldCheck size={16} /> Your account is protected with secure password hashing.</div>
          </div>
        </section>
      </main>
    );
  }

  const isAdmin = user.role === "admin";
  const navItems = isAdmin
    ? [{ id: "dashboard", label: "Overview", icon: BarChart3 }, { id: "rewards", label: "Rewards", icon: Gift }, { id: "customers", label: "Customers", icon: Users }, { id: "rules", label: "Reward rules", icon: RefreshCw }]
    : [{ id: "dashboard", label: "My dashboard", icon: BarChart3 }, { id: "rewards", label: "Explore rewards", icon: Gift }, { id: "history", label: "Activity history", icon: History }];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Sparkles size={21} /></span><span>LoyaltyLoop</span></div>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={page === item.id ? "nav-item active" : "nav-item"} onClick={() => setPage(item.id)}><Icon size={18} />{item.label}</button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-mini"><div className="avatar">{user.name?.charAt(0)?.toUpperCase()}</div><div className="profile-text"><strong>{user.name}</strong><span>{isAdmin ? "Administrator" : user.membership || "Member"}</span></div></div>
          <button className="nav-item logout" onClick={logout}><LogOut size={18} /> Sign out</button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div><span className="eyebrow">{isAdmin ? "ADMIN CONSOLE" : "MEMBER SPACE"}</span><h1>{pageTitle(page, isAdmin)}</h1></div>
          <div className="topbar-right"><span className="status-dot"></span><span>{isAdmin ? "System active" : "Member account"}</span><div className="avatar">{user.name?.charAt(0)?.toUpperCase()}</div></div>
        </header>

        <div className="content">
          {notice && <div className="alert alert-success">{notice}<button onClick={() => setNotice("")}><X size={15} /></button></div>}
          {error && <div className="alert alert-error">{error}<button onClick={() => setError("")}><X size={15} /></button></div>}
          {!data && <div className="loading"><RefreshCw className="spin" /> Loading your workspace...</div>}

          {data && !isAdmin && page === "dashboard" && (
            <>
              <section className="welcome-row"><div><span className="eyebrow">YOUR LOYALTY SNAPSHOT</span><h2>Good to see you, {user.name.split(" ")[0]} <span>✦</span></h2><p className="muted">Every purchase is another step toward something great.</p></div><span className="membership-pill"><Award size={16} /> {data.user.membership} member</span></section>
              <div className="stats-grid">
                <StatCard icon={Wallet} label="Available points" value={(data.user.pointsBalance || 0).toLocaleString("en-IN")} detail="Ready to redeem" tone="purple" />
                <StatCard icon={Gift} label="Rewards available" value={data.rewards.length} detail="Explore your options" tone="orange" />
                <StatCard icon={Award} label="Membership tier" value={data.user.membership} detail="Based on your points" tone="green" />
              </div>
             {false && (
  <section className="section-block">
    <div className="section-heading">
      <div>
        <h3>Record a demo purchase</h3>
        <p>Simulate a completed purchase to test the loyalty engine.</p>
      </div>
    </div>
  </section>
)}
              <section className="section-block">
                <div className="section-heading"><div><h3>Rewards picked for you</h3><p>Use your points to unlock something special.</p></div><button className="text-btn" onClick={() => setPage("rewards")}>View all rewards →</button></div>
                <div className="reward-grid">{data.rewards.slice(0, 3).map(reward => <RewardCard key={reward._id} reward={reward} balance={data.user.pointsBalance} onRedeem={redeem} busy={busy} />)}</div>
              </section>
              <TransactionTable transactions={data.transactions} />
            </>
          )}

      

          {data && !isAdmin && page === "history" && <TransactionTable transactions={data.transactions} full />}

          {data && isAdmin && page === "dashboard" && (
            <>
              <div className="welcome-row"><div><span className="eyebrow">BUSINESS AT A GLANCE</span><h2>Welcome to your control center</h2><p className="muted">Manage rewards, customers, and loyalty performance in one place.</p></div><span className="admin-pill"><ShieldCheck size={16} /> Admin access</span></div>
              <div className="stats-grid">
                <StatCard icon={Users} label="Total customers" value={data.stats.customers} detail="Registered members" tone="purple" />
                <StatCard icon={Gift} label="Rewards configured" value={data.stats.rewards} detail="Active and inactive" tone="orange" />
                <StatCard icon={Award} label="Points issued" value={data.stats.pointsIssued.toLocaleString("en-IN")} detail="Positive point transactions" tone="green" />
                <StatCard icon={RefreshCw} label="Redemptions" value={data.stats.redemptions} detail="Reward claims recorded" tone="blue" />
              </div>
              <section className="section-block"><div className="section-heading"><div><h3>Current earning rule</h3><p>This rule is applied to future demo purchases.</p></div><button className="text-btn" onClick={() => setPage("rules")}>Manage rule →</button></div><div className="rule-summary"><div><span className="rule-icon"><Sparkles /></span><div><strong>{data.rule.pointsAwarded} point{data.rule.pointsAwarded === 1 ? "" : "s"} for every {money(data.rule.spendAmount)}</strong><p>Welcome bonus: {data.rule.welcomeBonus} points per new customer</p></div></div><span className="active-label"><span className="status-dot"></span> Active</span></div></section>
              <TransactionTable transactions={data.recentTransactions} admin />
            </>
          )}

          {data && isAdmin && page === "rewards" && (
            <div className="admin-columns">
              <section className="section-block form-card">
                <div className="section-heading"><div><h3>{editingReward ? "Edit reward" : "Create a reward"}</h3><p>Changes appear in the customer catalogue.</p></div>{editingReward && <button className="icon-btn" onClick={() => { setEditingReward(null); setRewardForm({ title: "", description: "", category: "Coupon", pointsCost: "50", imageUrl: "" }); }}><X size={17} /></button>}</div>
                <form className="stack-form" onSubmit={saveReward}>
                  <label>Reward name<input required maxLength="100" value={rewardForm.title} onChange={e => setRewardForm({ ...rewardForm, title: e.target.value })} placeholder="e.g. ₹100 Shopping Coupon" /></label>
                  <label>Description<textarea rows="3" value={rewardForm.description} onChange={e => setRewardForm({ ...rewardForm, description: e.target.value })} placeholder="Describe the reward" /></label>
                  <label>
  Product image URL
  <input
    type="url"
    value={rewardForm.imageUrl || ""}
    onChange={e => setRewardForm({ ...rewardForm, imageUrl: e.target.value })}
    placeholder="https://example.com/coffee-mug.jpg"
  />
</label>
                  <label>Category<select value={rewardForm.category} onChange={e => setRewardForm({ ...rewardForm, category: e.target.value })}><option>Coupon</option><option>Gift</option><option>Experience</option><option>Voucher</option></select></label>
                  <label>Points required<input type="number" min="1" step="1" required value={rewardForm.pointsCost} onChange={e => setRewardForm({ ...rewardForm, pointsCost: e.target.value })} /></label>
                  <button className="btn btn-primary btn-wide" disabled={busy}>{editingReward ? "Save changes" : <><Plus size={17} /> Create reward</>}</button>
                </form>
              </section>
              <section className="section-block">
                <div className="section-heading"><div><h3>Manage rewards</h3><p>{data.rewards.length} rewards configured</p></div></div>
                <div className="manage-list">{data.rewards.map(reward => <div className="manage-reward" key={reward._id}><div className="reward-icon small"><Gift size={18} /></div><div className="manage-reward-info"><strong>{reward.title}</strong><span>{reward.pointsCost} points · {reward.active ? "Active" : "Inactive"}</span></div><button className="icon-btn" title="Edit" onClick={() => startEdit(reward)}>Edit</button><button className="icon-btn" title="Toggle active" onClick={() => toggleReward(reward)}><Power size={16} /></button><button className="icon-btn danger" title="Delete" onClick={() => deleteReward(reward)}><Trash2 size={16} /></button></div>)}</div>
              </section>
            </div>
          )}
        {data && !isAdmin && page === "rewards" && (
          <section className="section-block">
            <div className="section-heading">
              <div>
                <h3>Rewards catalogue</h3>
                <p>Choose a reward that matches your points balance.</p>
              </div>
              <span className="balance-chip">
                <Award size={16} /> {data.user.pointsBalance} points
              </span>
            </div>

            {data.rewards.length === 0 ? (
              <p>No rewards are available right now.</p>
            ) : (
              <div className="reward-grid">
                {data.rewards.map(reward => (
                  <RewardCard
                    key={reward._id}
                    reward={reward}
                    balance={data.user.pointsBalance}
                    onRedeem={redeem}
                    busy={busy}
                  />
                ))}
              </div>
            )}
          </section>
        )}
        {data && isAdmin && page === "customers" && (
  <section className="section-block">
    <div className="section-heading">
      <div>
        <h3>Customer directory</h3>
        <p>Manage customers and award loyalty points.</p>
      </div>
      <span className="balance-chip">
        <Users size={16} /> {data.customers.length} customers
      </span>
    </div>

    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Email</th>
            <th>Membership</th>
            <th>Points balance</th>
            <th>Joined</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.customers.map(customer => (
            <tr key={customer._id}>
              <td>
                <div className="customer-cell">
                  <div className="avatar">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <strong>{customer.name}</strong>
                </div>
              </td>
              <td>{customer.email}</td>
              <td><span className="tier-tag">{customer.membership}</span></td>
              <td><strong>{customer.pointsBalance}</strong></td>
              <td>{date(customer.createdAt)}</td>
              <td>
     <button
  className="btn btn-primary"
  onClick={() => awardPoints(customer._id, customer.name)}
>
  Award Points
</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {!data.customers.length && (
      <EmptyState text="No customers have registered yet." />
    )}
  </section>
)}

          {data && isAdmin && page === "rules" && (
            <div className="rules-layout">
              <section className="section-block form-card">
                <div className="section-heading"><div><h3>Points earning rule</h3><p>Configure how customers earn points from purchases.</p></div><span className="active-label"><span className="status-dot"></span> Active</span></div>
                <form className="stack-form" onSubmit={saveRule}>
                  <label>Purchase amount (₹)<span className="field-hint">How much must a customer spend?</span><input type="number" min="1" step="1" required value={ruleForm.spendAmount} onChange={e => setRuleForm({ ...ruleForm, spendAmount: e.target.value })} /></label>
                  <label>Points awarded<span className="field-hint">Points earned for each amount above</span><input type="number" min="1" step="1" required value={ruleForm.pointsAwarded} onChange={e => setRuleForm({ ...ruleForm, pointsAwarded: e.target.value })} /></label>
                  <label>Welcome bonus<span className="field-hint">Points given to new customers</span><input type="number" min="0" step="1" required value={ruleForm.welcomeBonus} onChange={e => setRuleForm({ ...ruleForm, welcomeBonus: e.target.value })} /></label>
                  <button className="btn btn-primary btn-wide" disabled={busy}>Save earning rule</button>
                </form>
              </section>
              <section className="section-block rule-preview"><span className="preview-spark"><Sparkles size={23} /></span><span className="eyebrow">LIVE RULE PREVIEW</span><h3>Customers earn</h3><div className="preview-points">{ruleForm.pointsAwarded || 0} <span>points</span></div><p>for every {money(Number(ruleForm.spendAmount) || 0)} spent</p><div className="preview-divider"></div><div className="preview-welcome"><Gift size={18} /><span>New members receive <strong>{ruleForm.welcomeBonus || 0} welcome points</strong></span></div><p className="small-note">The saved rule applies to future purchases. Previously awarded points are not recalculated.</p></section>
            </div>
          )}
        </div>
        <footer className="footer"><span>© 2026 LoyaltyLoop</span><span>Customer Loyalty & Reward Management System</span></footer>
      </main>
    </div>
  );
}

function pageTitle(page, admin) {
  const titles = { dashboard: admin ? "Overview" : "My dashboard", rewards: admin ? "Reward management" : "Explore rewards", customers: "Customers", rules: "Reward rules", history: "Activity history" };
  return titles[page] || "Dashboard";
}

function StatCard({ icon: Icon, label, value, detail, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20} /></div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-detail">{detail}</span></div>;
}
function RewardCard({ reward, balance, onRedeem, busy }) {
  const canRedeem = balance >= reward.pointsCost;
return (
  <article className="reward-card">
    <div className="reward-product-image">
      {reward.imageUrl ? (
        
          
          <img src={reward.imageUrl} alt={reward.title} />
        
      ) : (
        <div className="reward-icon">
          <Gift size={32} />
        </div>
      )}
    </div>

      <div className="reward-card-top">
        <span className="category-tag">{reward.category}</span>
      </div>

      <h4>{reward.title}</h4>
      <p>{reward.description || "A special reward for our valued members."}</p>

      <div className="reward-card-bottom">
        <div>
          <strong>{reward.pointsCost}</strong>
          <span> points</span>
        </div>

        <button
          className={canRedeem ? "btn btn-primary" : "btn btn-disabled"}
          disabled={!canRedeem || busy}
          onClick={() => onRedeem(reward)}
        >
          {canRedeem ? "Redeem" : "Need more"}
        </button>
      </div>
    </article>
  );
}

function TransactionTable({ transactions = [], admin = false, full = false }) {
  return <section className="section-block"><div className="section-heading"><div><h3>{admin ? "Recent activity" : "Recent activity"}</h3><p>{full ? "Your complete recent transaction history." : "A quick look at your latest point activity."}</p></div>{!full && <span className="tag">LATEST</span>}</div>
    {transactions.length ? <div className="table-wrap"><table><thead><tr>{admin && <th>Customer</th>}<th>Activity</th><th>Date</th><th>Points</th><th>Status</th></tr></thead><tbody>{transactions.map(item => <tr key={item._id}>{admin && <td><div className="customer-cell"><div className="avatar">{(item.user?.name || "C").charAt(0).toUpperCase()}</div><strong>{item.user?.name || "Customer"}</strong></div></td>}<td className="activity-cell"><span className="activity-type">{item.type.replace("_", " ")}</span><span>{item.description}</span></td><td className="date-cell">{date(item.createdAt)}</td><td className={item.points > 0 ? "points-positive" : "points-negative"}>{item.points > 0 ? "+" : ""}{item.points}</td><td><span className={`transaction-status ${item.type === "redemption" ? "used" : "earned"}`}>{item.type === "redemption" ? "Redeemed" : "Completed"}</span></td></tr>)}</tbody></table></div> : <EmptyState text="No activity yet. Your transactions will appear here." />}
  </section>;
}
function EmptyState({ text }) {
  return <div className="empty-state"><span className="empty-icon"><Gift size={22} /></span><p>{text}</p></div>;
}