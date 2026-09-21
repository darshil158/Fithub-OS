/* ============================================================
   FitHub OS — Demo Data Seed Generator
   Generates realistic data for all 26 collections.
   ============================================================ */

const Seed = (() => {
  'use strict';

  // ---------- Name pools ----------
  const FIRST_NAMES = ['Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Ayaan','Krishna','Ishaan',
    'Ananya','Diya','Myra','Aadhya','Isha','Kavya','Priya','Neha','Riya','Sara',
    'Rohan','Kabir','Shaurya','Atharv','Advait','Harsh','Pranav','Dhruv','Yash','Arnav',
    'Pooja','Shreya','Tanvi','Aisha','Meera','Nisha','Sanya','Rhea','Kiara','Zara',
    'Raj','Amit','Suresh','Vikram','Kiran','Deepak','Manoj','Rahul','Nikhil','Gaurav',
    'Sneha','Anjali','Divya','Swati','Pallavi','Komal','Mansi','Simran','Ritika','Bhavna'];

  const LAST_NAMES = ['Sharma','Patel','Singh','Kumar','Gupta','Verma','Joshi','Reddy','Nair','Iyer',
    'Mehta','Shah','Mishra','Chauhan','Yadav','Desai','Malhotra','Kapoor','Bhat','Pillai',
    'Agarwal','Jain','Saxena','Tiwari','Pandey','Srivastava','Thakur','Rao','Menon','Das'];

  const STREETS = ['MG Road','Gandhi Nagar','Nehru Street','Patel Road','Lake View Colony','Station Road',
    'Park Avenue','Ring Road','Civil Lines','Sector 15','Jubilee Hills','Banjara Hills',
    'Koramangala','Indiranagar','Andheri West','Bandra East','Connaught Place','Rajouri Garden'];

  const CITIES = ['Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Pune','Ahmedabad','Kolkata','Jaipur','Lucknow'];

  const SPECIALIZATIONS = ['Strength Training','HIIT','Yoga','CrossFit','Cardio','Pilates','Martial Arts',
    'Functional Training','Bodybuilding','Calisthenics','Zumba','Boxing','Swimming','Nutrition'];

  const CLASS_NAMES = ['Morning HIIT','Power Yoga','Spin Class','CrossFit WOD','Boxing Basics','Zumba Dance',
    'Pilates Core','Strength Circuit','Functional Fitness','Cardio Blast','Kickboxing','Meditation Flow'];

  const EQUIPMENT_NAMES = ['Treadmill','Elliptical','Stationary Bike','Rowing Machine','Leg Press','Smith Machine',
    'Cable Machine','Lat Pulldown','Chest Press','Shoulder Press','Dumbbells Set','Barbell Set',
    'Kettlebell Set','Battle Ropes','TRX Suspension','Pull-up Bar','Squat Rack','Bench Press',
    'Ab Roller','Resistance Bands','Foam Roller','Medicine Ball','Punching Bag','Yoga Mats'];

  const EXERCISE_NAMES = [
    {name:'Bench Press',category:'Strength',muscle:'Chest',equip:'Barbell'},
    {name:'Squats',category:'Strength',muscle:'Legs',equip:'Barbell'},
    {name:'Deadlift',category:'Strength',muscle:'Back',equip:'Barbell'},
    {name:'Overhead Press',category:'Strength',muscle:'Shoulders',equip:'Barbell'},
    {name:'Barbell Row',category:'Strength',muscle:'Back',equip:'Barbell'},
    {name:'Bicep Curl',category:'Strength',muscle:'Arms',equip:'Dumbbell'},
    {name:'Tricep Extension',category:'Strength',muscle:'Arms',equip:'Cable'},
    {name:'Leg Curl',category:'Strength',muscle:'Legs',equip:'Machine'},
    {name:'Leg Extension',category:'Strength',muscle:'Legs',equip:'Machine'},
    {name:'Lat Pulldown',category:'Strength',muscle:'Back',equip:'Cable'},
    {name:'Chest Fly',category:'Strength',muscle:'Chest',equip:'Dumbbell'},
    {name:'Lateral Raise',category:'Strength',muscle:'Shoulders',equip:'Dumbbell'},
    {name:'Plank',category:'Core',muscle:'Core',equip:'Bodyweight'},
    {name:'Crunches',category:'Core',muscle:'Core',equip:'Bodyweight'},
    {name:'Russian Twist',category:'Core',muscle:'Core',equip:'Medicine Ball'},
    {name:'Push-ups',category:'Bodyweight',muscle:'Chest',equip:'Bodyweight'},
    {name:'Pull-ups',category:'Bodyweight',muscle:'Back',equip:'Bodyweight'},
    {name:'Burpees',category:'Cardio',muscle:'Full Body',equip:'Bodyweight'},
    {name:'Box Jumps',category:'Plyometric',muscle:'Legs',equip:'Box'},
    {name:'Kettlebell Swing',category:'Strength',muscle:'Full Body',equip:'Kettlebell'},
    {name:'Treadmill Run',category:'Cardio',muscle:'Full Body',equip:'Treadmill'},
    {name:'Cycling',category:'Cardio',muscle:'Legs',equip:'Bike'},
    {name:'Jump Rope',category:'Cardio',muscle:'Full Body',equip:'Jump Rope'},
    {name:'Mountain Climbers',category:'Cardio',muscle:'Core',equip:'Bodyweight'},
    {name:'Lunges',category:'Strength',muscle:'Legs',equip:'Dumbbell'},
    {name:'Hip Thrust',category:'Strength',muscle:'Glutes',equip:'Barbell'},
    {name:'Face Pull',category:'Strength',muscle:'Shoulders',equip:'Cable'},
    {name:'Dips',category:'Bodyweight',muscle:'Chest',equip:'Bodyweight'},
    {name:'Hanging Leg Raise',category:'Core',muscle:'Core',equip:'Pull-up Bar'},
    {name:'Cable Crossover',category:'Strength',muscle:'Chest',equip:'Cable'}
  ];

  const LEAD_SOURCES = ['Walk-in','Website','Instagram','Facebook','Google Ads','Referral','Flyer','WhatsApp','Phone Inquiry','Event'];

  // ---------- Helpers ----------
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pickN(arr, n) { const s = [...arr]; const r = []; for (let i = 0; i < n && s.length; i++) { r.push(s.splice(Math.floor(Math.random() * s.length), 1)[0]); } return r; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randDate(daysAgo1, daysAgo2) {
    const d = new Date();
    d.setDate(d.getDate() - randInt(daysAgo2, daysAgo1));
    d.setHours(randInt(6, 22), randInt(0, 59));
    return d.toISOString();
  }
  function pastDate(daysAgo) {
    const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString().split('T')[0];
  }
  function futureDate(daysFromNow) {
    const d = new Date(); d.setDate(d.getDate() + daysFromNow); return d.toISOString().split('T')[0];
  }
  function email(first, last, domain) {
    return `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`;
  }
  function phone() { return '9' + String(randInt(100000000, 999999999)); }
  function avatarColor() {
    const colors = ['#6C5CE7','#00B894','#E17055','#74B9FF','#A29BFE','#FDCB6E','#E84393','#00CEC9','#FF7675','#55A3F5'];
    return pick(colors);
  }

  // ---------- Main Seed ----------
  function generate() {
    // ===== GYMS =====
    const gyms = [
      { id: 'gym-1', name: 'FitZone Premium', address: '42 MG Road, Koramangala', city: 'Bangalore', phone: '9876543210', email: 'info@fitzone.in', status: 'active', ownerId: 'user-2', plan: 'enterprise', logo: null, createdAt: pastDate(730) },
      { id: 'gym-2', name: 'PowerHouse Fitness', address: '15 Bandra East, Carter Road', city: 'Mumbai', phone: '9876543211', email: 'info@powerhouse.in', status: 'active', ownerId: 'user-2', plan: 'professional', logo: null, createdAt: pastDate(500) },
      { id: 'gym-3', name: 'FlexGym Studio', address: '88 Jubilee Hills, Road No 5', city: 'Hyderabad', phone: '9876543212', email: 'info@flexgym.in', status: 'active', ownerId: 'user-7', plan: 'starter', logo: null, createdAt: pastDate(300) }
    ];

    // ===== BRANCHES =====
    const branches = [
      { id: 'branch-1', gymId: 'gym-1', name: 'Downtown', address: '42 MG Road, Koramangala', city: 'Bangalore', managerId: 'user-3', phone: '9876543220', status: 'active', capacity: 200, createdAt: pastDate(730) },
      { id: 'branch-2', gymId: 'gym-1', name: 'Westside', address: '78 Indiranagar, 100ft Road', city: 'Bangalore', managerId: null, phone: '9876543221', status: 'active', capacity: 150, createdAt: pastDate(600) },
      { id: 'branch-3', gymId: 'gym-1', name: 'Uptown', address: '23 Whitefield, ITPL Road', city: 'Bangalore', managerId: null, phone: '9876543222', status: 'active', capacity: 180, createdAt: pastDate(400) },
      { id: 'branch-4', gymId: 'gym-2', name: 'Central', address: '15 Bandra East, Carter Road', city: 'Mumbai', managerId: null, phone: '9876543230', status: 'active', capacity: 250, createdAt: pastDate(500) },
      { id: 'branch-5', gymId: 'gym-2', name: 'Eastside', address: '55 Andheri West, Link Road', city: 'Mumbai', managerId: null, phone: '9876543231', status: 'active', capacity: 180, createdAt: pastDate(350) },
      { id: 'branch-6', gymId: 'gym-3', name: 'Main', address: '88 Jubilee Hills, Road No 5', city: 'Hyderabad', managerId: null, phone: '9876543240', status: 'active', capacity: 120, createdAt: pastDate(300) },
      { id: 'branch-7', gymId: 'gym-3', name: 'South', address: '34 Gachibowli, IT Park Road', city: 'Hyderabad', managerId: null, phone: '9876543241', status: 'active', capacity: 100, createdAt: pastDate(200) }
    ];

    // ===== USERS (demo accounts) =====
    const users = [
      { id: 'user-1', name: 'Admin User', email: 'admin@fithubos.com', password: 'admin123', role: 'super_admin', gymId: null, branchId: null, phone: '9000000001', status: 'active', avatar: avatarColor(), createdAt: pastDate(730) },
      { id: 'user-2', name: 'Rajesh Sharma', email: 'owner@fitzone.in', password: 'owner123', role: 'gym_owner', gymId: 'gym-1', branchId: null, phone: '9000000002', status: 'active', avatar: avatarColor(), createdAt: pastDate(730) },
      { id: 'user-3', name: 'Rudra Patel', email: 'manager@fitzone.in', password: 'manager123', role: 'branch_manager', gymId: 'gym-1', branchId: 'branch-1', phone: '9000000003', status: 'active', avatar: avatarColor(), createdAt: pastDate(700) },
      { id: 'user-4', name: 'Vikram Singh', email: 'trainer@fitzone.in', password: 'trainer123', role: 'trainer', gymId: 'gym-1', branchId: 'branch-1', phone: '9000000004', status: 'active', avatar: avatarColor(), createdAt: pastDate(650) },
      { id: 'user-5', name: 'Neha Gupta', email: 'staff@fitzone.in', password: 'staff123', role: 'staff', gymId: 'gym-1', branchId: 'branch-1', phone: '9000000005', status: 'active', avatar: avatarColor(), createdAt: pastDate(600) },
      { id: 'user-6', name: 'Arjun Kumar', email: 'member@fitzone.in', password: 'member123', role: 'member', gymId: 'gym-1', branchId: 'branch-1', phone: '9000000006', status: 'active', avatar: avatarColor(), createdAt: pastDate(365) },
      { id: 'user-7', name: 'Suresh Reddy', email: 'owner@flexgym.in', password: 'owner123', role: 'gym_owner', gymId: 'gym-3', branchId: null, phone: '9000000007', status: 'active', avatar: avatarColor(), createdAt: pastDate(300) }
    ];

    // ===== MEMBERSHIP PLANS =====
    const membershipPlans = [];
    const planTemplates = [
      { name: 'Basic Monthly', duration: 1, price: 1500, features: ['Gym Access','Locker'] },
      { name: 'Basic Quarterly', duration: 3, price: 4000, features: ['Gym Access','Locker','1 Group Class/week'] },
      { name: 'Basic Annual', duration: 12, price: 14000, features: ['Gym Access','Locker','2 Group Classes/week'] },
      { name: 'Premium Monthly', duration: 1, price: 3000, features: ['Full Access','Locker','All Classes','1 PT Session/week'] },
      { name: 'Premium Quarterly', duration: 3, price: 8000, features: ['Full Access','Locker','All Classes','2 PT Sessions/week','Diet Plan'] },
      { name: 'Premium Annual', duration: 12, price: 28000, features: ['Full Access','Locker','All Classes','3 PT Sessions/week','Diet Plan','Nutrition Consult'] }
    ];

    gyms.forEach(gym => {
      planTemplates.forEach((tpl, i) => {
        membershipPlans.push({
          id: `plan-${gym.id}-${i+1}`,
          gymId: gym.id,
          name: tpl.name,
          duration: tpl.duration,
          durationUnit: 'months',
          price: tpl.price + (gym.id === 'gym-1' ? 500 : gym.id === 'gym-2' ? 300 : 0),
          features: tpl.features,
          status: 'active',
          createdAt: gym.createdAt
        });
      });
    });

    // ===== TRAINERS =====
    const trainers = [];
    const trainerData = [
      { gymId: 'gym-1', branchId: 'branch-1' }, { gymId: 'gym-1', branchId: 'branch-1' },
      { gymId: 'gym-1', branchId: 'branch-2' }, { gymId: 'gym-1', branchId: 'branch-2' },
      { gymId: 'gym-1', branchId: 'branch-3' },
      { gymId: 'gym-2', branchId: 'branch-4' }, { gymId: 'gym-2', branchId: 'branch-4' },
      { gymId: 'gym-2', branchId: 'branch-5' }, { gymId: 'gym-2', branchId: 'branch-5' },
      { gymId: 'gym-3', branchId: 'branch-6' }, { gymId: 'gym-3', branchId: 'branch-6' },
      { gymId: 'gym-3', branchId: 'branch-7' },
      { gymId: 'gym-1', branchId: 'branch-1' }, { gymId: 'gym-2', branchId: 'branch-4' },
      { gymId: 'gym-3', branchId: 'branch-6' }
    ];

    trainerData.forEach((td, i) => {
      const fn = pick(FIRST_NAMES);
      const ln = pick(LAST_NAMES);
      trainers.push({
        id: `trainer-${i+1}`,
        gymId: td.gymId,
        branchId: td.branchId,
        name: `${fn} ${ln}`,
        email: email(fn, ln, 'gmail.com'),
        phone: phone(),
        specialization: pick(SPECIALIZATIONS),
        experience: randInt(1, 15),
        certifications: pickN(['ACSM','NASM','ACE','ISSA','CrossFit L1','Yoga Alliance'], randInt(1, 3)),
        salary: randInt(15000, 45000),
        status: i < 13 ? 'active' : 'inactive',
        joinDate: pastDate(randInt(60, 600)),
        avatar: avatarColor(),
        createdAt: pastDate(randInt(60, 600))
      });
    });
    // Link user-4 to trainer-1
    trainers[0].id = 'trainer-1';
    trainers[0].name = 'Vikram Singh';
    trainers[0].email = 'trainer@fitzone.in';
    trainers[0].userId = 'user-4';

    // ===== STAFF =====
    const staffMembers = [];
    const staffRoles = ['Receptionist','Floor Manager','Cleaning','Security','Accounts','Operations'];
    for (let i = 0; i < 10; i++) {
      const fn = pick(FIRST_NAMES);
      const ln = pick(LAST_NAMES);
      const gIdx = i < 4 ? 0 : i < 7 ? 1 : 2;
      const gym = gyms[gIdx];
      const gymBranches = branches.filter(b => b.gymId === gym.id);
      staffMembers.push({
        id: `staff-${i+1}`,
        gymId: gym.id,
        branchId: pick(gymBranches).id,
        name: `${fn} ${ln}`,
        email: email(fn, ln, 'gmail.com'),
        phone: phone(),
        role: pick(staffRoles),
        salary: randInt(10000, 25000),
        status: 'active',
        joinDate: pastDate(randInt(30, 500)),
        avatar: avatarColor(),
        createdAt: pastDate(randInt(30, 500))
      });
    }
    staffMembers[0].name = 'Neha Gupta';
    staffMembers[0].email = 'staff@fitzone.in';
    staffMembers[0].userId = 'user-5';

    // ===== MEMBERS (120+) =====
    const members = [];
    const memberStatuses = ['active','active','active','active','active','active','active','expired','frozen','cancelled'];

    for (let i = 0; i < 125; i++) {
      const fn = pick(FIRST_NAMES);
      const ln = pick(LAST_NAMES);
      const gIdx = i < 55 ? 0 : i < 90 ? 1 : 2;
      const gym = gyms[gIdx];
      const gymBranches = branches.filter(b => b.gymId === gym.id);
      const br = pick(gymBranches);
      const joinDays = randInt(5, 700);
      members.push({
        id: `member-${i+1}`,
        gymId: gym.id,
        branchId: br.id,
        name: `${fn} ${ln}`,
        email: email(fn, ln + (i+1), 'gmail.com'),
        phone: phone(),
        gender: i % 3 === 0 ? 'Female' : 'Male',
        dateOfBirth: `${randInt(1985, 2005)}-${String(randInt(1,12)).padStart(2,'0')}-${String(randInt(1,28)).padStart(2,'0')}`,
        address: `${randInt(1,500)} ${pick(STREETS)}, ${pick(CITIES)}`,
        emergencyContact: phone(),
        joinDate: pastDate(joinDays),
        status: pick(memberStatuses),
        avatar: avatarColor(),
        notes: '',
        createdAt: pastDate(joinDays)
      });
    }
    // Link user-6 to member-1
    members[0].id = 'member-1';
    members[0].name = 'Arjun Kumar';
    members[0].email = 'member@fitzone.in';
    members[0].userId = 'user-6';
    members[0].status = 'active';
    members[0].gymId = 'gym-1';
    members[0].branchId = 'branch-1';

    // ===== SUBSCRIPTIONS =====
    const subscriptions = [];
    members.forEach((m, i) => {
      const gymPlans = membershipPlans.filter(p => p.gymId === m.gymId);
      const plan = pick(gymPlans);
      const startDays = randInt(5, 400);
      const endDays = startDays - (plan.duration * 30);
      const isExpired = endDays > 0;
      subscriptions.push({
        id: `sub-${i+1}`,
        memberId: m.id,
        gymId: m.gymId,
        branchId: m.branchId,
        planId: plan.id,
        planName: plan.name,
        startDate: pastDate(startDays),
        endDate: isExpired ? pastDate(endDays) : futureDate(Math.abs(endDays)),
        amount: plan.price,
        status: isExpired ? 'expired' : (m.status === 'frozen' ? 'frozen' : 'active'),
        createdAt: pastDate(startDays)
      });
    });

    // ===== PAYMENTS =====
    const payments = [];
    const paymentMethods = ['Cash','Card','UPI','Net Banking','Wallet'];
    subscriptions.forEach((sub, i) => {
      payments.push({
        id: `pay-${i+1}`,
        subscriptionId: sub.id,
        memberId: sub.memberId,
        gymId: sub.gymId,
        branchId: sub.branchId,
        amount: sub.amount,
        method: pick(paymentMethods),
        status: 'paid',
        date: sub.startDate,
        transactionId: 'TXN' + String(100000 + i),
        createdAt: sub.startDate
      });
    });
    // Add some extra payments (renewals, partial)
    for (let i = 0; i < 80; i++) {
      const m = pick(members.filter(mm => mm.status === 'active'));
      const gymPlans = membershipPlans.filter(p => p.gymId === m.gymId);
      const plan = pick(gymPlans);
      payments.push({
        id: `pay-extra-${i+1}`,
        subscriptionId: null,
        memberId: m.id,
        gymId: m.gymId,
        branchId: m.branchId,
        amount: plan.price,
        method: pick(paymentMethods),
        status: i < 70 ? 'paid' : 'pending',
        date: randDate(0, 365),
        transactionId: 'TXN' + String(200000 + i),
        createdAt: randDate(0, 365)
      });
    }

    // ===== INVOICES =====
    const invoices = [];
    payments.slice(0, 100).forEach((p, i) => {
      const m = members.find(mm => mm.id === p.memberId);
      const gym = gyms.find(g => g.id === p.gymId);
      invoices.push({
        id: `inv-${i+1}`,
        paymentId: p.id,
        memberId: p.memberId,
        memberName: m?.name || 'Unknown',
        gymId: p.gymId,
        gymName: gym?.name || 'Unknown',
        invoiceNumber: `INV-${String(1001 + i)}`,
        items: [{ description: 'Membership Plan', amount: p.amount }],
        subtotal: p.amount,
        tax: Math.round(p.amount * 0.18),
        total: Math.round(p.amount * 1.18),
        status: p.status === 'paid' ? 'paid' : 'pending',
        date: p.date,
        dueDate: p.date,
        createdAt: p.date
      });
    });

    // ===== ATTENDANCE (500+) =====
    const attendance = [];
    for (let i = 0; i < 550; i++) {
      const m = pick(members.filter(mm => mm.status === 'active'));
      const day = randInt(0, 90);
      const checkInHour = randInt(5, 20);
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() - day);
      checkIn.setHours(checkInHour, randInt(0, 59), 0, 0);
      const checkOut = new Date(checkIn);
      checkOut.setHours(checkInHour + randInt(1, 3), randInt(0, 59));
      attendance.push({
        id: `att-${i+1}`,
        memberId: m.id,
        memberName: m.name,
        gymId: m.gymId,
        branchId: m.branchId,
        date: checkIn.toISOString().split('T')[0],
        checkIn: checkIn.toISOString(),
        checkOut: i % 5 === 0 ? null : checkOut.toISOString(),
        status: 'present',
        createdAt: checkIn.toISOString()
      });
    }

    // ===== CLASSES =====
    const classes = [];
    const timeSlots = ['06:00','07:00','08:00','09:00','10:00','16:00','17:00','18:00','19:00','20:00'];
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    for (let i = 0; i < 12; i++) {
      const gIdx = i < 5 ? 0 : i < 9 ? 1 : 2;
      const gym = gyms[gIdx];
      const gymBranches = branches.filter(b => b.gymId === gym.id);
      const gymTrainers = trainers.filter(t => t.gymId === gym.id);
      const br = pick(gymBranches);
      const tr = gymTrainers.length ? pick(gymTrainers) : trainers[0];
      classes.push({
        id: `class-${i+1}`,
        gymId: gym.id,
        branchId: br.id,
        name: CLASS_NAMES[i] || pick(CLASS_NAMES),
        trainerId: tr.id,
        trainerName: tr.name,
        schedule: {
          days: pickN(days, randInt(2, 4)),
          time: pick(timeSlots),
          durationMinutes: pick([45, 60, 75, 90])
        },
        capacity: randInt(15, 40),
        enrolled: randInt(5, 30),
        status: 'active',
        description: `A great ${CLASS_NAMES[i] || ''} session for all fitness levels.`,
        createdAt: pastDate(randInt(30, 400))
      });
    }

    // ===== CLASS BOOKINGS =====
    const classBookings = [];
    for (let i = 0; i < 60; i++) {
      const cls = pick(classes);
      const gymMembers = members.filter(mm => mm.gymId === cls.gymId && mm.status === 'active');
      if (!gymMembers.length) continue;
      const m = pick(gymMembers);
      classBookings.push({
        id: `booking-${i+1}`,
        classId: cls.id,
        className: cls.name,
        memberId: m.id,
        memberName: m.name,
        gymId: cls.gymId,
        branchId: cls.branchId,
        date: i < 30 ? futureDate(randInt(1, 14)) : pastDate(randInt(1, 30)),
        status: i < 40 ? 'confirmed' : (i < 50 ? 'completed' : 'cancelled'),
        createdAt: pastDate(randInt(0, 30))
      });
    }

    // ===== EXERCISES =====
    const exercises = EXERCISE_NAMES.map((ex, i) => ({
      id: `exercise-${i+1}`,
      name: ex.name,
      category: ex.category,
      muscleGroup: ex.muscle,
      equipment: ex.equip,
      description: `Standard ${ex.name} exercise targeting ${ex.muscle}.`,
      difficulty: pick(['Beginner','Intermediate','Advanced']),
      videoUrl: '',
      createdAt: pastDate(400)
    }));

    // ===== WORKOUT PLANS =====
    const workoutPlans = [];
    for (let i = 0; i < 20; i++) {
      const tr = pick(trainers.filter(t => t.status === 'active'));
      const gymMembers = members.filter(mm => mm.gymId === tr.gymId && mm.status === 'active');
      const m = gymMembers.length ? pick(gymMembers) : members[0];
      const planExercises = pickN(exercises, randInt(4, 8)).map(ex => ({
        exerciseId: ex.id,
        name: ex.name,
        sets: randInt(3, 5),
        reps: randInt(8, 15),
        rest: pick(['30s','45s','60s','90s'])
      }));
      workoutPlans.push({
        id: `workout-${i+1}`,
        trainerId: tr.id,
        trainerName: tr.name,
        memberId: m.id,
        memberName: m.name,
        gymId: tr.gymId,
        name: pick(['Push Pull Legs','Upper Lower Split','Full Body','Strength Focus','Fat Loss','Hypertrophy','Beginner Basics','Athletic Performance']) + ` Plan ${i+1}`,
        exercises: planExercises,
        weeks: randInt(4, 12),
        daysPerWeek: randInt(3, 6),
        goal: pick(['Muscle Gain','Fat Loss','Strength','Endurance','General Fitness']),
        status: i < 16 ? 'active' : 'completed',
        startDate: pastDate(randInt(5, 90)),
        createdAt: pastDate(randInt(5, 90))
      });
    }

    // ===== DIET PLANS =====
    const dietPlans = [];
    const mealTemplates = [
      { time: '7:00 AM', name: 'Breakfast', items: ['Oats with milk','2 boiled eggs','1 banana','Green tea'] },
      { time: '10:00 AM', name: 'Mid-Morning', items: ['Protein shake','5 almonds','1 apple'] },
      { time: '1:00 PM', name: 'Lunch', items: ['Brown rice','Grilled chicken 150g','Mixed salad','Dal'] },
      { time: '4:00 PM', name: 'Snack', items: ['Peanut butter toast','1 glass milk'] },
      { time: '7:30 PM', name: 'Dinner', items: ['Chapati x2','Paneer curry','Cucumber salad','Curd'] }
    ];
    for (let i = 0; i < 10; i++) {
      const tr = pick(trainers.filter(t => t.status === 'active'));
      const gymMembers = members.filter(mm => mm.gymId === tr.gymId && mm.status === 'active');
      const m = gymMembers.length ? pick(gymMembers) : members[0];
      dietPlans.push({
        id: `diet-${i+1}`,
        trainerId: tr.id,
        trainerName: tr.name,
        memberId: m.id,
        memberName: m.name,
        gymId: tr.gymId,
        name: pick(['Weight Loss','Muscle Gain','Maintenance','High Protein','Vegetarian','Keto']) + ` Diet ${i+1}`,
        meals: mealTemplates,
        dailyCalories: randInt(1800, 3200),
        protein: randInt(100, 200) + 'g',
        carbs: randInt(150, 350) + 'g',
        fats: randInt(50, 100) + 'g',
        notes: 'Drink at least 3L of water daily. Avoid processed foods.',
        status: 'active',
        startDate: pastDate(randInt(5, 60)),
        createdAt: pastDate(randInt(5, 60))
      });
    }

    // ===== LEADS / CRM =====
    const leads = [];
    const leadStatuses = ['new','contacted','interested','trial','converted','lost'];
    for (let i = 0; i < 25; i++) {
      const fn = pick(FIRST_NAMES);
      const ln = pick(LAST_NAMES);
      const gym = pick(gyms);
      leads.push({
        id: `lead-${i+1}`,
        gymId: gym.id,
        branchId: pick(branches.filter(b => b.gymId === gym.id)).id,
        name: `${fn} ${ln}`,
        email: email(fn, ln + randInt(1,99), 'gmail.com'),
        phone: phone(),
        source: pick(LEAD_SOURCES),
        status: pick(leadStatuses),
        assignedTo: pick(staffMembers.filter(s => s.gymId === gym.id))?.id || null,
        notes: pick(['Interested in premium plan','Asked about group classes','Wants trial session','Referred by existing member','Saw Instagram ad','']),
        createdAt: randDate(0, 90)
      });
    }

    // ===== FOLLOW-UPS =====
    const followUps = [];
    leads.forEach((lead, i) => {
      const numFollowUps = randInt(0, 3);
      for (let j = 0; j < numFollowUps; j++) {
        followUps.push({
          id: `followup-${i}-${j}`,
          leadId: lead.id,
          leadName: lead.name,
          gymId: lead.gymId,
          date: randDate(0, 60),
          method: pick(['Phone','WhatsApp','Email','In-person']),
          notes: pick(['Called, no answer','Interested, will visit tomorrow','Asked for discount','Scheduled trial session','Not interested right now']),
          outcome: pick(['Positive','Neutral','Negative','No Response']),
          nextDate: futureDate(randInt(1, 14)),
          status: pick(['completed','pending','scheduled']),
          createdAt: randDate(0, 60)
        });
      }
    });

    // ===== OFFERS / COUPONS =====
    const offers = [];
    const offerNames = ['New Year Special','Summer Slam','Referral Bonus','Student Discount','Early Bird','Flash Sale','Anniversary Deal','Diwali Offer','Weekend Special','Corporate Tie-up'];
    for (let i = 0; i < 15; i++) {
      const gym = pick(gyms);
      offers.push({
        id: `offer-${i+1}`,
        gymId: gym.id,
        name: offerNames[i] || pick(offerNames),
        code: 'FIT' + String(randInt(100, 999)),
        discountType: pick(['percentage','fixed']),
        discountValue: pick([10, 15, 20, 25, 500, 1000, 1500, 2000]),
        minPurchase: pick([0, 1000, 2000, 5000]),
        maxUses: randInt(10, 200),
        usedCount: randInt(0, 50),
        validFrom: pastDate(randInt(0, 60)),
        validTo: i < 10 ? futureDate(randInt(10, 90)) : pastDate(randInt(1, 30)),
        status: i < 10 ? 'active' : 'expired',
        description: `Save on your membership with ${offerNames[i] || 'this special offer'}!`,
        createdAt: pastDate(randInt(0, 90))
      });
    }

    // ===== EQUIPMENT =====
    const equipmentList = [];
    let eqIdx = 0;
    branches.forEach(br => {
      const numItems = randInt(3, 6);
      for (let j = 0; j < numItems; j++) {
        const eqName = EQUIPMENT_NAMES[eqIdx % EQUIPMENT_NAMES.length];
        equipmentList.push({
          id: `equip-${eqIdx+1}`,
          gymId: br.gymId,
          branchId: br.id,
          name: eqName,
          category: pick(['Cardio','Strength','Functional','Flexibility','Other']),
          brand: pick(['Life Fitness','Technogym','Precor','Hammer Strength','Rogue','Cybex']),
          model: 'Model ' + pick(['X1','Pro','Elite','S100','LX','Sport']),
          serialNumber: 'SN-' + String(randInt(100000, 999999)),
          purchaseDate: pastDate(randInt(30, 800)),
          purchasePrice: randInt(20000, 500000),
          warrantyExpiry: futureDate(randInt(30, 730)),
          status: pick(['operational','operational','operational','needs_repair','out_of_order']),
          condition: pick(['Excellent','Good','Fair','Poor']),
          createdAt: pastDate(randInt(30, 800))
        });
        eqIdx++;
      }
    });

    // ===== MAINTENANCE =====
    const maintenanceRecords = [];
    const eqNeedingMaint = equipmentList.filter(e => ['needs_repair','out_of_order'].includes(e.status));
    for (let i = 0; i < 15; i++) {
      const eq = i < eqNeedingMaint.length ? eqNeedingMaint[i] : pick(equipmentList);
      maintenanceRecords.push({
        id: `maint-${i+1}`,
        equipmentId: eq.id,
        equipmentName: eq.name,
        gymId: eq.gymId,
        branchId: eq.branchId,
        date: i < 8 ? pastDate(randInt(1, 60)) : futureDate(randInt(1, 30)),
        type: pick(['Preventive','Corrective','Emergency','Inspection']),
        description: pick(['Belt replacement needed','Routine lubrication','Display malfunction','Cable fraying','Bearing noise','Annual inspection']),
        cost: randInt(500, 15000),
        vendor: pick(['FitService Pro','GymTech Solutions','EquipCare','MaintenancePlus']),
        status: i < 8 ? pick(['completed','completed','in_progress']) : 'scheduled',
        createdAt: pastDate(randInt(0, 60))
      });
    }

    // ===== NOTIFICATIONS =====
    const notifications = [];
    const notifTemplates = [
      { title: 'Membership Expiring', message: 'Your membership expires in 7 days. Renew now!', type: 'warning' },
      { title: 'Payment Received', message: 'Payment of ₹3,000 received successfully.', type: 'success' },
      { title: 'New Member Joined', message: 'A new member has registered at your branch.', type: 'info' },
      { title: 'Class Reminder', message: 'Your Morning HIIT class starts in 1 hour.', type: 'info' },
      { title: 'Attendance Alert', message: 'Member attendance has dropped below 50% this month.', type: 'warning' },
      { title: 'Equipment Issue', message: 'Treadmill #3 reported as out of order.', type: 'danger' },
      { title: 'New Review', message: 'A member left a 5-star review for your gym.', type: 'success' },
      { title: 'Lead Assigned', message: 'A new lead has been assigned to you for follow-up.', type: 'info' },
      { title: 'System Update', message: 'FitHub OS has been updated with new features.', type: 'info' },
      { title: 'Payment Overdue', message: 'A payment is overdue. Please follow up.', type: 'danger' }
    ];
    for (let i = 0; i < 55; i++) {
      const tpl = pick(notifTemplates);
      const usr = pick(users);
      notifications.push({
        id: `notif-${i+1}`,
        userId: usr.id,
        title: tpl.title,
        message: tpl.message,
        type: tpl.type,
        read: i > 15,
        date: randDate(0, 30),
        createdAt: randDate(0, 30)
      });
    }

    // ===== REVIEWS =====
    const reviews = [];
    for (let i = 0; i < 25; i++) {
      const m = pick(members.filter(mm => mm.status === 'active'));
      const gym = gyms.find(g => g.id === m.gymId);
      reviews.push({
        id: `review-${i+1}`,
        memberId: m.id,
        memberName: m.name,
        gymId: m.gymId,
        gymName: gym?.name || '',
        branchId: m.branchId,
        rating: randInt(3, 5),
        comment: pick([
          'Great gym with excellent equipment and trainers!',
          'Love the group classes. Very motivating atmosphere.',
          'Clean facilities and friendly staff. Highly recommend.',
          'Good value for money. Plenty of equipment variety.',
          'Trainers are knowledgeable and supportive.',
          'Could use more cardio machines during peak hours.',
          'The yoga classes are fantastic!',
          'Parking could be better but overall a great experience.',
          'Best gym in the area. Worth every penny.',
          'Nice ambiance. A/C works well even during summer.'
        ]),
        status: 'approved',
        date: randDate(0, 180),
        createdAt: randDate(0, 180)
      });
    }

    // ===== AUDIT LOGS =====
    const auditLogs = [];
    const auditActions = [
      { action: 'create', module: 'members', details: 'Created new member' },
      { action: 'update', module: 'members', details: 'Updated member profile' },
      { action: 'create', module: 'payments', details: 'Recorded new payment' },
      { action: 'login', module: 'auth', details: 'User logged in' },
      { action: 'create', module: 'subscriptions', details: 'New subscription created' },
      { action: 'update', module: 'classes', details: 'Updated class schedule' },
      { action: 'delete', module: 'leads', details: 'Deleted lead record' },
      { action: 'create', module: 'gyms', details: 'New gym registered' },
      { action: 'update', module: 'equipment', details: 'Equipment status changed' },
      { action: 'create', module: 'attendance', details: 'Attendance marked' }
    ];
    for (let i = 0; i < 120; i++) {
      const tpl = pick(auditActions);
      const usr = pick(users);
      auditLogs.push({
        id: `audit-${i+1}`,
        userId: usr.id,
        userName: usr.name,
        userRole: usr.role,
        action: tpl.action,
        module: tpl.module,
        details: tpl.details,
        ipAddress: `192.168.${randInt(1,10)}.${randInt(1,254)}`,
        timestamp: randDate(0, 90),
        createdAt: randDate(0, 90)
      });
    }

    // ===== ROLES & PERMISSIONS =====
    const roles = [
      { id: 'role-1', name: 'Super Admin', key: 'super_admin', description: 'Full platform access' },
      { id: 'role-2', name: 'Gym Owner', key: 'gym_owner', description: 'Manage owned gyms' },
      { id: 'role-3', name: 'Branch Manager', key: 'branch_manager', description: 'Manage assigned branch' },
      { id: 'role-4', name: 'Trainer', key: 'trainer', description: 'Manage assigned members fitness' },
      { id: 'role-5', name: 'Staff', key: 'staff', description: 'Operational access' },
      { id: 'role-6', name: 'Member', key: 'member', description: 'Personal access only' }
    ];

    // ===== WRITE TO LOCALSTORAGE =====
    const collections = {
      users, gyms, branches, roles,
      membershipPlans, members, trainers, staff: staffMembers,
      subscriptions, payments, invoices, attendance,
      classes, classBookings, exercises, workoutPlans, dietPlans,
      leads, followUps, offers, equipment: equipmentList,
      maintenance: maintenanceRecords, notifications, reviews, auditLogs
    };

    Object.entries(collections).forEach(([key, data]) => {
      localStorage.setItem(DB.PREFIX + key, JSON.stringify(data));
    });

    DB.markSeeded();
    console.log('✅ FitHub OS demo data seeded successfully');
    return collections;
  }

  return { generate };
})();

// Auto-seed on first load
if (!DB.isSeeded()) {
  Seed.generate();
}
