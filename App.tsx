import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const C = {
  white: '#FFFFFF',
  blue: '#007BFF',
  blueDark: '#0056D6',
  blueDeep: '#0040A8',
  blueSoft: '#E8F3FF',
  blueMid: '#B9D9FF',
  ink: '#0F172A',
  slate: '#334155',
  mute: '#64748B',
  line: '#E2E8F0',
  mist: '#F1F5F9',
  success: '#0F9D58',
  successSoft: '#E7F8EF',
  danger: '#DC2626',
  dangerSoft: '#FEECEC',
  black: '#111111',
};

type Lang = 'en' | 'de' | 'fr' | 'pt' | 'hi';
type Role = 'customer' | 'worker' | 'admin';
type ServiceId = 'cleaning' | 'gardening' | 'handyman' | 'painting' | 'plumbing' | 'electrical';
type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
type PayMethod = 'card' | 'apple' | 'google';
type AuthGate = 'splash' | 'login' | 'signup' | 'adminPin' | 'app';
type Screen =
  | 'home'
  | 'bookings'
  | 'chat'
  | 'rewards'
  | 'profile'
  | 'service'
  | 'worker'
  | 'book'
  | 'pay'
  | 'done'
  | 'thread'
  | 'jobs'
  | 'earnings'
  | 'adminHome'
  | 'adminFinance'
  | 'adminUsers';

const PRICES: Record<ServiceId, number> = {
  cleaning: 20,
  gardening: 22,
  handyman: 25,
  painting: 28,
  plumbing: 30,
  electrical: 35,
};

const SERVICE_ICONS: Record<ServiceId, keyof typeof Ionicons.glyphMap> = {
  cleaning: 'sparkles',
  gardening: 'leaf',
  handyman: 'hammer',
  painting: 'color-palette',
  plumbing: 'water',
  electrical: 'flash',
};

const SERVICE_IDS: ServiceId[] = ['cleaning', 'gardening', 'handyman', 'painting', 'plumbing', 'electrical'];

const I18N: Record<Lang, Record<string, string>> = {
  en: {
    appName: 'LuxServices',
    tagline: 'On-demand home care across Europe',
    search: 'Search services or nearby workers',
    home: 'Home',
    bookings: 'Bookings',
    messages: 'Messages',
    rewards: 'Rewards',
    profile: 'Account',
    services: 'Services',
    nearby: 'Nearby workers',
    seeAll: 'See all',
    bookNow: 'Book now',
    perHour: '/hr',
    rating: 'Rating',
    jobsDone: 'Jobs',
    reviews: 'Reviews',
    language: 'Language',
    role: 'View',
    customer: 'Customer',
    worker: 'Worker',
    admin: 'Admin',
    switchRole: 'Switch role',
    luxPoints: 'LuxPoints',
    balance: 'Balance',
    applyPoints: 'Apply LuxPoints',
    cashback: 'Cashback',
    howItWorks: 'How rewards work',
    cleaning: 'Home Cleaning',
    gardening: 'Gardening',
    handyman: 'Handyman',
    painting: 'Painting',
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    cleaningDesc: 'Deep clean kitchens, baths and living spaces with eco products.',
    gardeningDesc: 'Lawn care, hedges, planting and seasonal garden maintenance.',
    handymanDesc: 'Repairs, assembly, mounting and small home improvements.',
    paintingDesc: 'Interior walls, trim and touch-ups with premium finishes.',
    plumbingDesc: 'Leaks, fittings, unblocking and fixture installation.',
    electricalDesc: 'Sockets, lighting, safe checks by certified electricians.',
    bookService: 'Book this service',
    selectDate: 'Select date',
    selectTime: 'Select time',
    duration: 'Duration',
    hours: 'hours',
    hour: 'hour',
    address: 'Address',
    notes: 'Notes for the pro',
    addressHidden: 'Exact address hidden until payment',
    addressRevealed: 'Address shared with your pro',
    gdpr: 'GDPR protected',
    contactInApp: 'Contact only via LuxServices chat',
    payment: 'Payment',
    payCard: 'Card',
    applePay: 'Apple Pay',
    googlePay: 'Google Pay',
    cardNumber: 'Card number',
    expiry: 'MM/YY',
    cvc: 'CVC',
    pay: 'Pay securely',
    processing: 'Processing with Stripe…',
    success: 'Payment confirmed',
    confirmed: 'Booking confirmed',
    rewardEarned: 'Reward added',
    upcoming: 'Upcoming',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    accept: 'Accept',
    reject: 'Reject',
    noBookings: 'No bookings yet',
    incoming: 'Incoming jobs',
    income: 'Income',
    incentives: 'Incentives',
    commission: 'Platform commission',
    platformFee: '€5 flat commission',
    revenue: 'Gross volume',
    privacy: 'Privacy & security',
    chatPh: 'Message in-app…',
    send: 'Send',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'LuxPoints discount',
    markets: 'Markets',
    luxembourg: 'Luxembourg',
    germany: 'Germany',
    france: 'France',
    verified: 'Verified',
    topRated: 'Top rated',
    available: 'Available',
    all: 'All',
    noResults: 'No matching services or workers',
    settings: 'Settings',
    notifications: 'Notifications',
    help: 'Help centre',
    about: 'About LuxServices',
    logout: 'Sign out demo',
    welcome: 'Good day',
    welcomeSub: 'Book trusted pros in LU · DE · FR',
    usePoints: 'Use €{n} LuxPoints',
    pointsApplied: 'Points applied',
    secure: 'Stripe encrypted checkout',
    bookingDetails: 'Booking details',
    scheduled: 'Scheduled',
    back: 'Back',
    cancel: 'Cancel',
    confirm: 'Confirm',
    done: 'Done',
    location: 'City',
    cardholder: 'Name on card',
    workerDash: 'Worker dashboard',
    adminPanel: 'Admin panel',
    customerView: 'Customer view',
    today: 'Today',
    week: 'This week',
    month: 'This month',
    acceptJob: 'Accept job',
    rejectJob: 'Decline job',
    users: 'People',
    finance: 'Finance',
    overview: 'Overview',
    noMessages: 'No conversations yet',
    startChat: 'Message after booking',
    emptySearch: 'Try another name or service',
    emptyBookings: 'Book a pro to see it here',
    commissionNote: '€5 platform fee is tracked for every paid booking.',
    hideContact: 'Phone and email stay private',
    inAppOnly: 'In-app communication only',
    revealAfter: 'Exact address unlocks after payment',
    pointsInfo: 'Earn €1–€2 LuxPoints after each paid booking. Redeem on the next visit.',
    rewardInfo: 'Customers receive a €1–€2 cashback reward on every completed payment.',
    incentiveInfo: 'Workers receive a €1–€2 incentive on every accepted paid job.',
    jobsTab: 'Jobs',
    earningsTab: 'Earnings',
    netPayout: 'Net payout',
    paid: 'Paid',
    pending: 'Pending',
    rejected: 'Declined',
    inProgress: 'In progress',
    openChat: 'Open chat',
    bookWorker: 'Book this pro',
    from: 'From',
    featured: 'Featured in your city',
    apply: 'Apply',
    remove: 'Remove',
    youSave: 'You save',
    continue: 'Continue',
    chooseMethod: 'Choose a payment method',
    payAmount: 'Pay',
    bookingId: 'Booking ID',
    assigned: 'Assigned pro',
    sharedNow: 'Address is now visible to your pro',
    protected: 'Contact details protected',
    stats: 'Performance',
    ledger: 'Commission ledger',
    gmv: 'Gross merchandise',
    rewardsPaid: 'Customer rewards',
    incentivesPaid: 'Worker incentives',
    live: 'Live',
    filterCity: 'City',
    hoursLabel: 'Hours',
    whatsIncluded: 'What’s included',
    languagesSpoken: 'Languages',
    aboutPro: 'About',
    noPhone: 'No phone number shared',
    noEmail: 'No email shared',
    stripe: 'Powered by Stripe',
    applePayHint: 'Pay with Face ID / Touch ID',
    googlePayHint: 'Pay with Google Pay wallet',
    cardHint: 'Visa, Mastercard, Maestro',
    invalidCard: 'Enter a valid 16-digit card number',
    fillAll: 'Please complete all payment fields',
    fillBooking: 'Choose date, time and enter your address',
    jobAccepted: 'Job accepted',
    jobRejected: 'Job declined',
    newRequest: 'New request',
    trackIncome: 'Track income',
    demoUser: 'Alex Moreau',
    demoCity: 'Luxembourg City',
    saved: 'Preferences saved',
    refresh: 'Updated',
    adminUsers: 'Users & pros',
    adminBookings: 'All bookings',
    customerReward: 'Customer reward',
    workerIncentive: 'Worker incentive',
    platformKeep: 'Platform keeps',
    workerNet: 'Worker receives',
    afterPay: 'After payment',
    chatSecure: 'End-to-end in-app messaging',
    writeHere: 'Write a message',
    todayJobs: 'Jobs today',
    availableNow: 'Available now',
    offline: 'Offline',
    selectService: 'Select a service',
    popular: 'Popular this week',
    trust: 'Insured · Background-checked · GDPR',
    pointsShort: 'Pts',
    useReward: 'Redeem on checkout',
    history: 'History',
    howTitle: 'Financial flow',
    how1: 'Customer pays the hourly rate × hours.',
    how2: 'Optional LuxPoints discount (your €2.50+ balance).',
    how3: '€1–€2 cashback credited to the customer.',
    how4: '€1–€2 incentive credited to the worker.',
    how5: '€5 flat commission is booked to the platform.',
    manage: 'Manage',
    roleHint: 'Preview every side of the marketplace.',
    marketHint: 'Operating in Luxembourg, Germany and France.',
    logoutDone: 'Demo session reset',
    notificationsOn: 'Push alerts for jobs and chat',
    helpBody: 'Support via in-app chat. We never share phone or email.',
    aboutBody: 'LuxServices is the on-demand home platform for LU, DE and FR.',
    tapPay: 'Tap to pay',
    confirmPay: 'Confirm and pay',
    paidWith: 'Paid with',
    remainingPoints: 'Remaining LuxPoints',
    earned: 'Earned',
    spent: 'Redeemed',
    open: 'Open',
    none: 'Nothing here yet',
    workerView: 'Worker view',
    adminView: 'Admin view',
    homeTab: 'Home',
    searchLive: 'Live results',
    nearbyShort: 'Nearby',
    bookTitle: 'Schedule',
    payTitle: 'Secure checkout',
    doneTitle: 'You’re booked',
    chatTitle: 'Secure chat',
    profileTitle: 'Account',
    rewardsTitle: 'LuxPoints',
    jobsTitle: 'Job board',
    earnTitle: 'Income',
    adminTitle: 'Control centre',
    finTitle: 'Finance',
    peopleTitle: 'Directory',
    serviceTitle: 'Service',
    proTitle: 'Professional',
    cancelBooking: 'Cancel booking',
    keep: 'Keep booking',
    cancelledOk: 'Booking cancelled',
    status: 'Status',
    when: 'When',
    where: 'Where',
    price: 'Price',
    rate: 'Rate',
    method: 'Method',
    card: 'Card',
    hiddenUntil: 'Hidden until payment confirmation',
    unlocks: 'Unlocks after Stripe confirmation',
    msgPro: 'Message pro',
    msgCustomer: 'Message customer',
    acceptHint: 'Accepting notifies the customer in-app.',
    declineHint: 'Declining returns the request to the pool.',
    commissionFlat: '€5.00',
    pointsBal: '€2.50 starting balance',
    euro: '€',
    splashWelcome: 'Welcome to LuxServices',
    splashHello: 'Trusted home care, on demand',
    splashSub: 'Book verified pros in Luxembourg, Germany and France.',
    splashDetect: 'Detecting your country…',
    splashDetected: 'Localised for {country}',
    splashContinue: 'Get started',
    welcomeTo: 'Welcome',
    loginTitle: 'Sign in',
    loginSub: 'Your home services, in one secure app.',
    email: 'Email',
    password: 'Password',
    fullName: 'Full name',
    loginCta: 'Sign in',
    signupCta: 'Create account',
    signupTitle: 'Create your account',
    signupSub: 'GDPR-safe. We never share phone or email.',
    noAccount: 'New here?',
    hasAccount: 'Already registered?',
    orContinue: 'or',
    forgot: 'Need a demo?',
    demoLogin: 'Continue with demo',
    staffAccess: 'Staff',
    adminPinTitle: 'Admin access',
    adminPinSub: 'Enter the secret 4-digit PIN',
    enterPin: 'Enter PIN',
    pinWrong: 'Incorrect PIN',
    pinOk: 'Access granted',
    unlockAdmin: 'Unlock admin panel',
    backToLogin: 'Back to sign in',
    detecting: 'Locating you',
    detectedAs: 'Detected',
    localeAuto: 'Language set from your country',
    changeAnytime: 'Change language anytime',
    sessionAs: 'Signed in as',
    signIn: 'Sign in',
    createAccount: 'Create account',
    workerLogin: 'Join as a pro',
    customerLogin: 'Join as a customer',
    pinHint: 'Staff PIN',
    secretAdmin: 'Restricted',
    marketsLive: 'Live in LU · DE · FR',
    splashCats: 'Popular near you',
    autoLang: 'Auto',
    countryFrance: 'France',
    countryGermany: 'Germany',
    countryLuxembourg: 'Luxembourg',
    countryDefault: 'Europe',
    skip: 'Skip',
    emailPh: 'you@email.eu',
    passwordPh: '••••••••',
    namePh: 'Alex Moreau',
    invalidAuth: 'Enter a valid email and password (6+ characters)',
    accountReady: 'Account ready',
    signedIn: 'Signed in',
    pinClear: 'Clear',
    localeManual: 'Language chosen manually',
    detectedCountry: 'Country',
    rewardsHint: 'Earn cashback as LuxPoints after each paid booking. Redeem them as a checkout discount.',
    jobAmount: 'Job amount',
    yourPay: 'This job',
    includeInsured: 'Insured visit',
    includeUpdates: 'In-app updates',
    includeAddress: 'Address after payment',
    includeCashback: 'LuxPoints cashback',
  },
  de: {
    appName: 'LuxServices',
    tagline: 'Haushaltsservice auf Abruf in Europa',
    search: 'Dienste oder Fachkräfte suchen',
    home: 'Start',
    bookings: 'Buchungen',
    messages: 'Nachrichten',
    rewards: 'Prämien',
    profile: 'Konto',
    services: 'Leistungen',
    nearby: 'Fachkräfte in der Nähe',
    seeAll: 'Alle',
    bookNow: 'Jetzt buchen',
    perHour: '/Std.',
    rating: 'Bewertung',
    jobsDone: 'Aufträge',
    reviews: 'Bewertungen',
    language: 'Sprache',
    role: 'Ansicht',
    customer: 'Kunde',
    worker: 'Fachkraft',
    admin: 'Admin',
    switchRole: 'Rolle wechseln',
    luxPoints: 'LuxPoints',
    balance: 'Guthaben',
    applyPoints: 'LuxPoints einlösen',
    cashback: 'Cashback',
    howItWorks: 'So funktionieren Prämien',
    cleaning: 'Hausreinigung',
    gardening: 'Gartenpflege',
    handyman: 'Hausmeister',
    painting: 'Malerarbeiten',
    plumbing: 'Sanitär',
    electrical: 'Elektro',
    cleaningDesc: 'Gründliche Reinigung von Küche, Bad und Wohnräumen.',
    gardeningDesc: 'Rasen, Hecken, Pflanzung und saisonale Pflege.',
    handymanDesc: 'Reparaturen, Montage und kleine Verbesserungen.',
    paintingDesc: 'Innenwände, Leisten und Ausbesserungen.',
    plumbingDesc: 'Undichtigkeiten, Anschlüsse und Installationen.',
    electricalDesc: 'Steckdosen, Licht und sichere Prüfungen.',
    bookService: 'Diesen Dienst buchen',
    selectDate: 'Datum wählen',
    selectTime: 'Uhrzeit wählen',
    duration: 'Dauer',
    hours: 'Stunden',
    hour: 'Stunde',
    address: 'Adresse',
    notes: 'Hinweis für die Fachkraft',
    addressHidden: 'Adresse erst nach Zahlung sichtbar',
    addressRevealed: 'Adresse mit Fachkraft geteilt',
    gdpr: 'DSGVO-geschützt',
    contactInApp: 'Kontakt nur über LuxServices-Chat',
    payment: 'Zahlung',
    payCard: 'Karte',
    applePay: 'Apple Pay',
    googlePay: 'Google Pay',
    cardNumber: 'Kartennummer',
    expiry: 'MM/JJ',
    cvc: 'CVC',
    pay: 'Sicher bezahlen',
    processing: 'Stripe verarbeitet…',
    success: 'Zahlung bestätigt',
    confirmed: 'Buchung bestätigt',
    rewardEarned: 'Prämie gutgeschrieben',
    upcoming: 'Bevorstehend',
    active: 'Aktiv',
    completed: 'Abgeschlossen',
    cancelled: 'Storniert',
    accept: 'Annehmen',
    reject: 'Ablehnen',
    noBookings: 'Noch keine Buchungen',
    incoming: 'Eingehende Aufträge',
    income: 'Einkommen',
    incentives: 'Anreize',
    commission: 'Plattformprovision',
    platformFee: '5 € Pauschalprovision',
    revenue: 'Bruttovolumen',
    privacy: 'Datenschutz & Sicherheit',
    chatPh: 'In-App schreiben…',
    send: 'Senden',
    total: 'Summe',
    subtotal: 'Zwischensumme',
    discount: 'LuxPoints-Rabatt',
    markets: 'Märkte',
    luxembourg: 'Luxemburg',
    germany: 'Deutschland',
    france: 'Frankreich',
    verified: 'Verifiziert',
    topRated: 'Top bewertet',
    available: 'Verfügbar',
    all: 'Alle',
    noResults: 'Keine Treffer',
    settings: 'Einstellungen',
    notifications: 'Benachrichtigungen',
    help: 'Hilfe',
    about: 'Über LuxServices',
    logout: 'Demo zurücksetzen',
    welcome: 'Guten Tag',
    welcomeSub: 'Zuverlässige Profis in LU · DE · FR',
    usePoints: '€{n} LuxPoints nutzen',
    pointsApplied: 'Punkte angewendet',
    secure: 'Stripe-verschlüsselte Zahlung',
    bookingDetails: 'Buchungsdetails',
    scheduled: 'Geplant',
    back: 'Zurück',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    done: 'Fertig',
    location: 'Stadt',
    cardholder: 'Name auf der Karte',
    workerDash: 'Fachkraft-Cockpit',
    adminPanel: 'Admin-Bereich',
    customerView: 'Kundenansicht',
    today: 'Heute',
    week: 'Diese Woche',
    month: 'Dieser Monat',
    acceptJob: 'Auftrag annehmen',
    rejectJob: 'Auftrag ablehnen',
    users: 'Personen',
    finance: 'Finanzen',
    overview: 'Überblick',
    noMessages: 'Noch keine Chats',
    startChat: 'Nachricht nach Buchung',
    emptySearch: 'Anderen Begriff versuchen',
    emptyBookings: 'Buchen Sie eine Fachkraft',
    commissionNote: '5 € Provision je bezahlter Buchung.',
    hideContact: 'Telefon und E-Mail bleiben privat',
    inAppOnly: 'Nur In-App-Kommunikation',
    revealAfter: 'Adresse nach Zahlung frei',
    pointsInfo: 'Nach jeder Zahlung 1–2 € LuxPoints. Einlösen beim nächsten Mal.',
    rewardInfo: 'Kunden erhalten 1–2 € Cashback je Zahlung.',
    incentiveInfo: 'Fachkräfte erhalten 1–2 € Anreiz je angenommenem Auftrag.',
    jobsTab: 'Aufträge',
    earningsTab: 'Einnahmen',
    netPayout: 'Nettoauszahlung',
    paid: 'Bezahlt',
    pending: 'Ausstehend',
    rejected: 'Abgelehnt',
    inProgress: 'Laufend',
    openChat: 'Chat öffnen',
    bookWorker: 'Diese Fachkraft buchen',
    from: 'Ab',
    featured: 'Empfohlen in Ihrer Stadt',
    apply: 'Anwenden',
    remove: 'Entfernen',
    youSave: 'Sie sparen',
    continue: 'Weiter',
    chooseMethod: 'Zahlungsart wählen',
    payAmount: 'Zahlen',
    bookingId: 'Buchungs-ID',
    assigned: 'Zugewiesene Fachkraft',
    sharedNow: 'Adresse ist jetzt sichtbar',
    protected: 'Kontaktdaten geschützt',
    stats: 'Leistung',
    ledger: 'Provisionsbuch',
    gmv: 'Bruttowarenwert',
    rewardsPaid: 'Kundenprämien',
    incentivesPaid: 'Anreize Fachkräfte',
    live: 'Live',
    filterCity: 'Stadt',
    hoursLabel: 'Stunden',
    whatsIncluded: 'Inklusivleistungen',
    languagesSpoken: 'Sprachen',
    aboutPro: 'Über',
    noPhone: 'Keine Telefonnummer',
    noEmail: 'Keine E-Mail',
    stripe: 'Powered by Stripe',
    applePayHint: 'Mit Face ID / Touch ID zahlen',
    googlePayHint: 'Mit Google Pay zahlen',
    cardHint: 'Visa, Mastercard, Maestro',
    invalidCard: 'Gültige 16-stellige Kartennummer',
    fillAll: 'Bitte alle Zahlungsfelder ausfüllen',
    fillBooking: 'Datum, Uhrzeit und Adresse wählen',
    jobAccepted: 'Auftrag angenommen',
    jobRejected: 'Auftrag abgelehnt',
    newRequest: 'Neue Anfrage',
    trackIncome: 'Einkommen verfolgen',
    demoUser: 'Alex Moreau',
    demoCity: 'Luxemburg-Stadt',
    saved: 'Gespeichert',
    refresh: 'Aktualisiert',
    adminUsers: 'Nutzer & Profis',
    adminBookings: 'Alle Buchungen',
    customerReward: 'Kundenprämie',
    workerIncentive: 'Anreiz Fachkraft',
    platformKeep: 'Plattform behält',
    workerNet: 'Fachkraft erhält',
    afterPay: 'Nach der Zahlung',
    chatSecure: 'Sicherer In-App-Chat',
    writeHere: 'Nachricht schreiben',
    todayJobs: 'Aufträge heute',
    availableNow: 'Jetzt verfügbar',
    offline: 'Offline',
    selectService: 'Dienst wählen',
    popular: 'Beliebt diese Woche',
    trust: 'Versichert · Geprüft · DSGVO',
    pointsShort: 'Pkt',
    useReward: 'An der Kasse einlösen',
    history: 'Verlauf',
    howTitle: 'Zahlungsfluss',
    how1: 'Kunde zahlt Stundensatz × Stunden.',
    how2: 'Optionaler LuxPoints-Rabatt.',
    how3: '1–2 € Cashback für den Kunden.',
    how4: '1–2 € Anreiz für die Fachkraft.',
    how5: '5 € Pauschalprovision für die Plattform.',
    manage: 'Verwalten',
    roleHint: 'Alle Marktplatz-Seiten ansehen.',
    marketHint: 'Aktiv in Luxemburg, Deutschland und Frankreich.',
    logoutDone: 'Demo zurückgesetzt',
    notificationsOn: 'Push für Aufträge und Chat',
    helpBody: 'Support im Chat. Telefon und E-Mail bleiben privat.',
    aboutBody: 'LuxServices ist die Home-Plattform für LU, DE und FR.',
    tapPay: 'Tippen zum Zahlen',
    confirmPay: 'Bestätigen und zahlen',
    paidWith: 'Bezahlt mit',
    remainingPoints: 'Verbleibende LuxPoints',
    earned: 'Erhalten',
    spent: 'Eingelöst',
    open: 'Öffnen',
    none: 'Noch nichts vorhanden',
    workerView: 'Fachkraft-Ansicht',
    adminView: 'Admin-Ansicht',
    homeTab: 'Start',
    searchLive: 'Live-Ergebnisse',
    nearbyShort: 'Nähe',
    bookTitle: 'Termin',
    payTitle: 'Sichere Kasse',
    doneTitle: 'Gebucht',
    chatTitle: 'Sicherer Chat',
    profileTitle: 'Konto',
    rewardsTitle: 'LuxPoints',
    jobsTitle: 'Auftragsliste',
    earnTitle: 'Einkommen',
    adminTitle: 'Zentrale',
    finTitle: 'Finanzen',
    peopleTitle: 'Verzeichnis',
    serviceTitle: 'Dienst',
    proTitle: 'Fachkraft',
    cancelBooking: 'Buchung stornieren',
    keep: 'Behalten',
    cancelledOk: 'Buchung storniert',
    status: 'Status',
    when: 'Wann',
    where: 'Wo',
    price: 'Preis',
    rate: 'Satz',
    method: 'Methode',
    card: 'Karte',
    hiddenUntil: 'Verborgen bis Zahlungsbestätigung',
    unlocks: 'Frei nach Stripe-Bestätigung',
    msgPro: 'Pro schreiben',
    msgCustomer: 'Kunde schreiben',
    acceptHint: 'Annahme benachrichtigt den Kunden.',
    declineHint: 'Ablehnung gibt die Anfrage frei.',
    commissionFlat: '€5,00',
    pointsBal: '€2,50 Startguthaben',
    euro: '€',
    splashWelcome: 'Willkommen bei LuxServices',
    splashHello: 'Zuverlässige Hilfe, auf Abruf',
    splashSub: 'Buchen Sie geprüfte Fachkräfte in Luxemburg, Deutschland und Frankreich.',
    splashDetect: 'Ihr Land wird erkannt…',
    splashDetected: 'Lokalisiert für {country}',
    splashContinue: 'Loslegen',
    welcomeTo: 'Willkommen',
    loginTitle: 'Anmelden',
    loginSub: 'Ihre Haushaltsservices in einer sicheren App.',
    email: 'E-Mail',
    password: 'Passwort',
    fullName: 'Vollständiger Name',
    loginCta: 'Anmelden',
    signupCta: 'Konto erstellen',
    signupTitle: 'Konto anlegen',
    signupSub: 'DSGVO-sicher. Telefon und E-Mail bleiben privat.',
    noAccount: 'Neu hier?',
    hasAccount: 'Bereits registriert?',
    orContinue: 'oder',
    forgot: 'Demo nötig?',
    demoLogin: 'Mit Demo fortfahren',
    staffAccess: 'Team',
    adminPinTitle: 'Admin-Zugang',
    adminPinSub: 'Geheime 4-stellige PIN eingeben',
    enterPin: 'PIN eingeben',
    pinWrong: 'Falsche PIN',
    pinOk: 'Zugang gewährt',
    unlockAdmin: 'Admin-Bereich öffnen',
    backToLogin: 'Zurück zur Anmeldung',
    detecting: 'Standort wird ermittelt',
    detectedAs: 'Erkannt',
    localeAuto: 'Sprache anhand Ihres Landes gesetzt',
    changeAnytime: 'Sprache jederzeit ändern',
    sessionAs: 'Angemeldet als',
    signIn: 'Anmelden',
    createAccount: 'Konto erstellen',
    workerLogin: 'Als Fachkraft starten',
    customerLogin: 'Als Kunde starten',
    pinHint: 'Team-PIN',
    secretAdmin: 'Eingeschränkt',
    marketsLive: 'Live in LU · DE · FR',
    splashCats: 'Beliebt in Ihrer Nähe',
    autoLang: 'Auto',
    countryFrance: 'Frankreich',
    countryGermany: 'Deutschland',
    countryLuxembourg: 'Luxemburg',
    countryDefault: 'Europa',
    skip: 'Überspringen',
    emailPh: 'sie@email.eu',
    passwordPh: '••••••••',
    namePh: 'Alex Moreau',
    invalidAuth: 'Gültige E-Mail und Passwort (min. 6 Zeichen)',
    accountReady: 'Konto bereit',
    signedIn: 'Angemeldet',
    pinClear: 'Löschen',
    localeManual: 'Sprache manuell gewählt',
    detectedCountry: 'Land',
    rewardsHint: 'Nach jeder Zahlung Cashback als LuxPoints. An der Kasse als Rabatt einlösen.',
    jobAmount: 'Auftragswert',
    yourPay: 'Dieser Auftrag',
    includeInsured: 'Versicherter Einsatz',
    includeUpdates: 'In-App-Updates',
    includeAddress: 'Adresse nach Zahlung',
    includeCashback: 'LuxPoints-Cashback',
  },
  fr: {
    appName: 'LuxServices',
    tagline: 'Services à domicile en Europe',
    search: 'Rechercher un service ou un pro',
    home: 'Accueil',
    bookings: 'Réservations',
    messages: 'Messages',
    rewards: 'Récompenses',
    profile: 'Compte',
    services: 'Services',
    nearby: 'Pros à proximité',
    seeAll: 'Tout voir',
    bookNow: 'Réserver',
    perHour: '/h',
    rating: 'Note',
    jobsDone: 'Missions',
    reviews: 'Avis',
    language: 'Langue',
    role: 'Vue',
    customer: 'Client',
    worker: 'Prestataire',
    admin: 'Admin',
    switchRole: 'Changer de rôle',
    luxPoints: 'LuxPoints',
    balance: 'Solde',
    applyPoints: 'Utiliser LuxPoints',
    cashback: 'Cashback',
    howItWorks: 'Fonctionnement',
    cleaning: 'Ménage',
    gardening: 'Jardinage',
    handyman: 'Bricolage',
    painting: 'Peinture',
    plumbing: 'Plomberie',
    electrical: 'Électricité',
    cleaningDesc: 'Nettoyage profond cuisine, salles de bain et pièces de vie.',
    gardeningDesc: 'Pelouse, haies, plantations et entretien saisonnier.',
    handymanDesc: 'Réparations, montage et petits travaux.',
    paintingDesc: 'Murs intérieurs, boiseries et retouches.',
    plumbingDesc: 'Fuites, raccords et installation d’équipements.',
    electricalDesc: 'Prises, éclairage et contrôles de sécurité.',
    bookService: 'Réserver ce service',
    selectDate: 'Choisir la date',
    selectTime: 'Choisir l’heure',
    duration: 'Durée',
    hours: 'heures',
    hour: 'heure',
    address: 'Adresse',
    notes: 'Note pour le pro',
    addressHidden: 'Adresse masquée jusqu’au paiement',
    addressRevealed: 'Adresse partagée avec le pro',
    gdpr: 'Protégé RGPD',
    contactInApp: 'Contact uniquement via le chat LuxServices',
    payment: 'Paiement',
    payCard: 'Carte',
    applePay: 'Apple Pay',
    googlePay: 'Google Pay',
    cardNumber: 'Numéro de carte',
    expiry: 'MM/AA',
    cvc: 'CVC',
    pay: 'Payer en sécurité',
    processing: 'Traitement Stripe…',
    success: 'Paiement confirmé',
    confirmed: 'Réservation confirmée',
    rewardEarned: 'Récompense ajoutée',
    upcoming: 'À venir',
    active: 'Actives',
    completed: 'Terminées',
    cancelled: 'Annulées',
    accept: 'Accepter',
    reject: 'Refuser',
    noBookings: 'Aucune réservation',
    incoming: 'Demandes entrantes',
    income: 'Revenus',
    incentives: 'Primes',
    commission: 'Commission plateforme',
    platformFee: 'Commission forfaitaire 5 €',
    revenue: 'Volume brut',
    privacy: 'Confidentialité & sécurité',
    chatPh: 'Écrire dans l’app…',
    send: 'Envoyer',
    total: 'Total',
    subtotal: 'Sous-total',
    discount: 'Réduction LuxPoints',
    markets: 'Marchés',
    luxembourg: 'Luxembourg',
    germany: 'Allemagne',
    france: 'France',
    verified: 'Vérifié',
    topRated: 'Top noté',
    available: 'Disponible',
    all: 'Tous',
    noResults: 'Aucun résultat',
    settings: 'Réglages',
    notifications: 'Notifications',
    help: 'Aide',
    about: 'À propos',
    logout: 'Réinitialiser la démo',
    welcome: 'Bonjour',
    welcomeSub: 'Pros de confiance à LU · DE · FR',
    usePoints: 'Utiliser €{n} LuxPoints',
    pointsApplied: 'Points appliqués',
    secure: 'Paiement chiffré Stripe',
    bookingDetails: 'Détails',
    scheduled: 'Planifié',
    back: 'Retour',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    done: 'Terminé',
    location: 'Ville',
    cardholder: 'Nom sur la carte',
    workerDash: 'Espace prestataire',
    adminPanel: 'Panneau admin',
    customerView: 'Vue client',
    today: 'Aujourd’hui',
    week: 'Cette semaine',
    month: 'Ce mois',
    acceptJob: 'Accepter',
    rejectJob: 'Refuser',
    users: 'Personnes',
    finance: 'Finance',
    overview: 'Aperçu',
    noMessages: 'Aucune conversation',
    startChat: 'Message après réservation',
    emptySearch: 'Essayez un autre terme',
    emptyBookings: 'Réservez un pro',
    commissionNote: '5 € de commission par réservation payée.',
    hideContact: 'Téléphone et e-mail restent privés',
    inAppOnly: 'Communication uniquement in-app',
    revealAfter: 'Adresse après paiement',
    pointsInfo: 'Gagnez 1–2 € de LuxPoints après chaque paiement.',
    rewardInfo: 'Les clients reçoivent 1–2 € de cashback.',
    incentiveInfo: 'Les pros reçoivent 1–2 € de prime par mission acceptée.',
    jobsTab: 'Missions',
    earningsTab: 'Revenus',
    netPayout: 'Net à verser',
    paid: 'Payé',
    pending: 'En attente',
    rejected: 'Refusé',
    inProgress: 'En cours',
    openChat: 'Ouvrir le chat',
    bookWorker: 'Réserver ce pro',
    from: 'Dès',
    featured: 'À la une dans votre ville',
    apply: 'Appliquer',
    remove: 'Retirer',
    youSave: 'Vous économisez',
    continue: 'Continuer',
    chooseMethod: 'Choisir un moyen de paiement',
    payAmount: 'Payer',
    bookingId: 'N° de réservation',
    assigned: 'Pro assigné',
    sharedNow: 'Adresse désormais visible',
    protected: 'Coordonnées protégées',
    stats: 'Performance',
    ledger: 'Journal des commissions',
    gmv: 'Volume brut',
    rewardsPaid: 'Récompenses clients',
    incentivesPaid: 'Primes pros',
    live: 'Live',
    filterCity: 'Ville',
    hoursLabel: 'Heures',
    whatsIncluded: 'Inclus',
    languagesSpoken: 'Langues',
    aboutPro: 'À propos',
    noPhone: 'Aucun téléphone partagé',
    noEmail: 'Aucun e-mail partagé',
    stripe: 'Propulsé par Stripe',
    applePayHint: 'Payer avec Face ID / Touch ID',
    googlePayHint: 'Payer avec Google Pay',
    cardHint: 'Visa, Mastercard, Maestro',
    invalidCard: 'Numéro de carte à 16 chiffres',
    fillAll: 'Complétez tous les champs',
    fillBooking: 'Choisissez date, heure et adresse',
    jobAccepted: 'Mission acceptée',
    jobRejected: 'Mission refusée',
    newRequest: 'Nouvelle demande',
    trackIncome: 'Suivre les revenus',
    demoUser: 'Alex Moreau',
    demoCity: 'Luxembourg-Ville',
    saved: 'Enregistré',
    refresh: 'Actualisé',
    adminUsers: 'Utilisateurs & pros',
    adminBookings: 'Toutes les réservations',
    customerReward: 'Récompense client',
    workerIncentive: 'Prime prestataire',
    platformKeep: 'La plateforme conserve',
    workerNet: 'Le pro reçoit',
    afterPay: 'Après paiement',
    chatSecure: 'Messagerie in-app sécurisée',
    writeHere: 'Écrire un message',
    todayJobs: 'Missions du jour',
    availableNow: 'Disponible',
    offline: 'Hors ligne',
    selectService: 'Choisir un service',
    popular: 'Populaire cette semaine',
    trust: 'Assuré · Vérifié · RGPD',
    pointsShort: 'Pts',
    useReward: 'Utiliser au paiement',
    history: 'Historique',
    howTitle: 'Flux financier',
    how1: 'Le client paie le tarif horaire × heures.',
    how2: 'Réduction LuxPoints optionnelle.',
    how3: 'Cashback de 1–2 € pour le client.',
    how4: 'Prime de 1–2 € pour le prestataire.',
    how5: 'Commission forfaitaire de 5 € pour la plateforme.',
    manage: 'Gérer',
    roleHint: 'Prévisualisez chaque face du marché.',
    marketHint: 'Actif au Luxembourg, en Allemagne et en France.',
    logoutDone: 'Démo réinitialisée',
    notificationsOn: 'Alertes missions et chat',
    helpBody: 'Support via le chat. Jamais de téléphone ni d’e-mail.',
    aboutBody: 'LuxServices, la plateforme maison pour LU, DE et FR.',
    tapPay: 'Appuyer pour payer',
    confirmPay: 'Confirmer et payer',
    paidWith: 'Payé avec',
    remainingPoints: 'LuxPoints restants',
    earned: 'Gagné',
    spent: 'Utilisé',
    open: 'Ouvrir',
    none: 'Rien pour le moment',
    workerView: 'Vue prestataire',
    adminView: 'Vue admin',
    homeTab: 'Accueil',
    searchLive: 'Résultats en direct',
    nearbyShort: 'Proche',
    bookTitle: 'Planning',
    payTitle: 'Paiement sécurisé',
    doneTitle: 'Réservé',
    chatTitle: 'Chat sécurisé',
    profileTitle: 'Compte',
    rewardsTitle: 'LuxPoints',
    jobsTitle: 'Missions',
    earnTitle: 'Revenus',
    adminTitle: 'Pilotage',
    finTitle: 'Finance',
    peopleTitle: 'Annuaire',
    serviceTitle: 'Service',
    proTitle: 'Professionnel',
    cancelBooking: 'Annuler la réservation',
    keep: 'Conserver',
    cancelledOk: 'Réservation annulée',
    status: 'Statut',
    when: 'Quand',
    where: 'Où',
    price: 'Prix',
    rate: 'Tarif',
    method: 'Moyen',
    card: 'Carte',
    hiddenUntil: 'Masqué jusqu’à confirmation',
    unlocks: 'Visible après Stripe',
    msgPro: 'Écrire au pro',
    msgCustomer: 'Écrire au client',
    acceptHint: 'Le client est notifié dans l’app.',
    declineHint: 'La demande retourne au pool.',
    commissionFlat: '5,00 €',
    pointsBal: 'Solde initial 2,50 €',
    euro: '€',
    splashWelcome: 'Bienvenue sur LuxServices',
    splashHello: 'L’aide à domicile, à la demande',
    splashSub: 'Réservez des pros vérifiés au Luxembourg, en Allemagne et en France.',
    splashDetect: 'Détection de votre pays…',
    splashDetected: 'Localisé pour {country}',
    splashContinue: 'Commencer',
    welcomeTo: 'Bienvenue',
    loginTitle: 'Connexion',
    loginSub: 'Vos services à domicile, dans une app sécurisée.',
    email: 'E-mail',
    password: 'Mot de passe',
    fullName: 'Nom complet',
    loginCta: 'Se connecter',
    signupCta: 'Créer un compte',
    signupTitle: 'Créer votre compte',
    signupSub: 'Conforme RGPD. Jamais de téléphone ni d’e-mail partagés.',
    noAccount: 'Nouveau ?',
    hasAccount: 'Déjà inscrit ?',
    orContinue: 'ou',
    forgot: 'Besoin d’une démo ?',
    demoLogin: 'Continuer en démo',
    staffAccess: 'Équipe',
    adminPinTitle: 'Accès admin',
    adminPinSub: 'Saisissez le code PIN secret à 4 chiffres',
    enterPin: 'Saisir le PIN',
    pinWrong: 'PIN incorrect',
    pinOk: 'Accès autorisé',
    unlockAdmin: 'Ouvrir le panneau admin',
    backToLogin: 'Retour à la connexion',
    detecting: 'Localisation en cours',
    detectedAs: 'Détecté',
    localeAuto: 'Langue définie selon votre pays',
    changeAnytime: 'Changez la langue à tout moment',
    sessionAs: 'Connecté en tant que',
    signIn: 'Se connecter',
    createAccount: 'Créer un compte',
    workerLogin: 'Rejoindre comme pro',
    customerLogin: 'Rejoindre comme client',
    pinHint: 'PIN équipe',
    secretAdmin: 'Restreint',
    marketsLive: 'Actif à LU · DE · FR',
    splashCats: 'Populaire près de chez vous',
    autoLang: 'Auto',
    countryFrance: 'France',
    countryGermany: 'Allemagne',
    countryLuxembourg: 'Luxembourg',
    countryDefault: 'Europe',
    skip: 'Passer',
    emailPh: 'vous@email.eu',
    passwordPh: '••••••••',
    namePh: 'Alex Moreau',
    invalidAuth: 'E-mail valide et mot de passe (6+ caractères)',
    accountReady: 'Compte prêt',
    signedIn: 'Connecté',
    pinClear: 'Effacer',
    localeManual: 'Langue choisie manuellement',
    detectedCountry: 'Pays',
    rewardsHint: 'Gagnez du cashback en LuxPoints après chaque paiement. Utilisez-les en réduction.',
    jobAmount: 'Montant de la mission',
    yourPay: 'Cette mission',
    includeInsured: 'Visite assurée',
    includeUpdates: 'Mises à jour in-app',
    includeAddress: 'Adresse après paiement',
    includeCashback: 'Cashback LuxPoints',
  },
  pt: {
    appName: 'LuxServices',
    tagline: 'Serviços ao domicílio na Europa',
    search: 'Pesquisar serviços ou profissionais',
    home: 'Início',
    bookings: 'Reservas',
    messages: 'Mensagens',
    rewards: 'Prémios',
    profile: 'Conta',
    services: 'Serviços',
    nearby: 'Profissionais perto',
    seeAll: 'Ver tudo',
    bookNow: 'Reservar',
    perHour: '/h',
    rating: 'Avaliação',
    jobsDone: 'Trabalhos',
    reviews: 'Opiniões',
    language: 'Idioma',
    role: 'Vista',
    customer: 'Cliente',
    worker: 'Profissional',
    admin: 'Admin',
    switchRole: 'Mudar de função',
    luxPoints: 'LuxPoints',
    balance: 'Saldo',
    applyPoints: 'Usar LuxPoints',
    cashback: 'Cashback',
    howItWorks: 'Como funciona',
    cleaning: 'Limpeza',
    gardening: 'Jardinagem',
    handyman: 'Canalizador geral',
    painting: 'Pintura',
    plumbing: 'Canalização',
    electrical: 'Eletricidade',
    cleaningDesc: 'Limpeza profunda de cozinhas, casas de banho e salas.',
    gardeningDesc: 'Relvado, sebes, plantação e manutenção sazonal.',
    handymanDesc: 'Reparações, montagens e pequenas melhorias.',
    paintingDesc: 'Paredes interiores, acabamentos e retoques.',
    plumbingDesc: 'Fugas, ligações e instalação de equipamentos.',
    electricalDesc: 'Tomadas, iluminação e verificações de segurança.',
    bookService: 'Reservar este serviço',
    selectDate: 'Escolher data',
    selectTime: 'Escolher hora',
    duration: 'Duração',
    hours: 'horas',
    hour: 'hora',
    address: 'Morada',
    notes: 'Nota para o profissional',
    addressHidden: 'Morada oculta até ao pagamento',
    addressRevealed: 'Morada partilhada com o profissional',
    gdpr: 'Protegido pelo RGPD',
    contactInApp: 'Contacto apenas via chat LuxServices',
    payment: 'Pagamento',
    payCard: 'Cartão',
    applePay: 'Apple Pay',
    googlePay: 'Google Pay',
    cardNumber: 'Número do cartão',
    expiry: 'MM/AA',
    cvc: 'CVC',
    pay: 'Pagar com segurança',
    processing: 'A processar com Stripe…',
    success: 'Pagamento confirmado',
    confirmed: 'Reserva confirmada',
    rewardEarned: 'Prémio adicionado',
    upcoming: 'Próximas',
    active: 'Ativas',
    completed: 'Concluídas',
    cancelled: 'Canceladas',
    accept: 'Aceitar',
    reject: 'Recusar',
    noBookings: 'Sem reservas',
    incoming: 'Pedidos recebidos',
    income: 'Rendimento',
    incentives: 'Incentivos',
    commission: 'Comissão da plataforma',
    platformFee: 'Comissão fixa de 5 €',
    revenue: 'Volume bruto',
    privacy: 'Privacidade e segurança',
    chatPh: 'Escrever na app…',
    send: 'Enviar',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'Desconto LuxPoints',
    markets: 'Mercados',
    luxembourg: 'Luxemburgo',
    germany: 'Alemanha',
    france: 'França',
    verified: 'Verificado',
    topRated: 'Bem avaliado',
    available: 'Disponível',
    all: 'Todos',
    noResults: 'Sem resultados',
    settings: 'Definições',
    notifications: 'Notificações',
    help: 'Ajuda',
    about: 'Sobre a LuxServices',
    logout: 'Repor demonstração',
    welcome: 'Olá',
    welcomeSub: 'Profissionais de confiança em LU · DE · FR',
    usePoints: 'Usar €{n} LuxPoints',
    pointsApplied: 'Pontos aplicados',
    secure: 'Checkout encriptado Stripe',
    bookingDetails: 'Detalhes',
    scheduled: 'Agendado',
    back: 'Voltar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    done: 'Concluído',
    location: 'Cidade',
    cardholder: 'Nome no cartão',
    workerDash: 'Painel do profissional',
    adminPanel: 'Painel admin',
    customerView: 'Vista de cliente',
    today: 'Hoje',
    week: 'Esta semana',
    month: 'Este mês',
    acceptJob: 'Aceitar trabalho',
    rejectJob: 'Recusar trabalho',
    users: 'Pessoas',
    finance: 'Finanças',
    overview: 'Resumo',
    noMessages: 'Sem conversas',
    startChat: 'Mensagem após reserva',
    emptySearch: 'Tente outro termo',
    emptyBookings: 'Reserve um profissional',
    commissionNote: '5 € de comissão por reserva paga.',
    hideContact: 'Telefone e e-mail permanecem privados',
    inAppOnly: 'Apenas comunicação na app',
    revealAfter: 'Morada após pagamento',
    pointsInfo: 'Ganhe 1–2 € de LuxPoints após cada pagamento.',
    rewardInfo: 'Os clientes recebem 1–2 € de cashback.',
    incentiveInfo: 'Os profissionais recebem 1–2 € de incentivo.',
    jobsTab: 'Trabalhos',
    earningsTab: 'Rendimentos',
    netPayout: 'Pagamento líquido',
    paid: 'Pago',
    pending: 'Pendente',
    rejected: 'Recusado',
    inProgress: 'Em curso',
    openChat: 'Abrir chat',
    bookWorker: 'Reservar este profissional',
    from: 'Desde',
    featured: 'Destaque na sua cidade',
    apply: 'Aplicar',
    remove: 'Remover',
    youSave: 'Poupou',
    continue: 'Continuar',
    chooseMethod: 'Escolher método',
    payAmount: 'Pagar',
    bookingId: 'ID da reserva',
    assigned: 'Profissional atribuído',
    sharedNow: 'Morada agora visível',
    protected: 'Contactos protegidos',
    stats: 'Desempenho',
    ledger: 'Livro de comissões',
    gmv: 'Volume bruto',
    rewardsPaid: 'Prémios de clientes',
    incentivesPaid: 'Incentivos',
    live: 'Ao vivo',
    filterCity: 'Cidade',
    hoursLabel: 'Horas',
    whatsIncluded: 'Incluído',
    languagesSpoken: 'Idiomas',
    aboutPro: 'Sobre',
    noPhone: 'Sem telefone partilhado',
    noEmail: 'Sem e-mail partilhado',
    stripe: 'Powered by Stripe',
    applePayHint: 'Pagar com Face ID / Touch ID',
    googlePayHint: 'Pagar com Google Pay',
    cardHint: 'Visa, Mastercard, Maestro',
    invalidCard: 'Número de cartão com 16 dígitos',
    fillAll: 'Preencha todos os campos',
    fillBooking: 'Escolha data, hora e morada',
    jobAccepted: 'Trabalho aceite',
    jobRejected: 'Trabalho recusado',
    newRequest: 'Novo pedido',
    trackIncome: 'Acompanhar rendimento',
    demoUser: 'Alex Moreau',
    demoCity: 'Cidade do Luxemburgo',
    saved: 'Guardado',
    refresh: 'Atualizado',
    adminUsers: 'Utilizadores e pros',
    adminBookings: 'Todas as reservas',
    customerReward: 'Prémio do cliente',
    workerIncentive: 'Incentivo do profissional',
    platformKeep: 'A plataforma retém',
    workerNet: 'O profissional recebe',
    afterPay: 'Após pagamento',
    chatSecure: 'Mensagens seguras na app',
    writeHere: 'Escrever mensagem',
    todayJobs: 'Trabalhos de hoje',
    availableNow: 'Disponível agora',
    offline: 'Offline',
    selectService: 'Selecionar serviço',
    popular: 'Popular esta semana',
    trust: 'Segurado · Verificado · RGPD',
    pointsShort: 'Pts',
    useReward: 'Usar no pagamento',
    history: 'Histórico',
    howTitle: 'Fluxo financeiro',
    how1: 'O cliente paga a tarifa horária × horas.',
    how2: 'Desconto opcional de LuxPoints.',
    how3: 'Cashback de 1–2 € para o cliente.',
    how4: 'Incentivo de 1–2 € para o profissional.',
    how5: 'Comissão fixa de 5 € para a plataforma.',
    manage: 'Gerir',
    roleHint: 'Pré-visualize todos os lados do mercado.',
    marketHint: 'A operar no Luxemburgo, Alemanha e França.',
    logoutDone: 'Demonstração reposta',
    notificationsOn: 'Alertas de trabalhos e chat',
    helpBody: 'Apoio via chat. Nunca partilhamos telefone ou e-mail.',
    aboutBody: 'LuxServices é a plataforma de casa para LU, DE e FR.',
    tapPay: 'Toque para pagar',
    confirmPay: 'Confirmar e pagar',
    paidWith: 'Pago com',
    remainingPoints: 'LuxPoints restantes',
    earned: 'Ganho',
    spent: 'Usado',
    open: 'Abrir',
    none: 'Ainda nada aqui',
    workerView: 'Vista profissional',
    adminView: 'Vista admin',
    homeTab: 'Início',
    searchLive: 'Resultados em direto',
    nearbyShort: 'Perto',
    bookTitle: 'Agendar',
    payTitle: 'Pagamento seguro',
    doneTitle: 'Reservado',
    chatTitle: 'Chat seguro',
    profileTitle: 'Conta',
    rewardsTitle: 'LuxPoints',
    jobsTitle: 'Trabalhos',
    earnTitle: 'Rendimento',
    adminTitle: 'Centro de controlo',
    finTitle: 'Finanças',
    peopleTitle: 'Diretório',
    serviceTitle: 'Serviço',
    proTitle: 'Profissional',
    cancelBooking: 'Cancelar reserva',
    keep: 'Manter',
    cancelledOk: 'Reserva cancelada',
    status: 'Estado',
    when: 'Quando',
    where: 'Onde',
    price: 'Preço',
    rate: 'Tarifa',
    method: 'Método',
    card: 'Cartão',
    hiddenUntil: 'Oculto até confirmação',
    unlocks: 'Visível após Stripe',
    msgPro: 'Mensagem ao pro',
    msgCustomer: 'Mensagem ao cliente',
    acceptHint: 'A aceitação notifica o cliente.',
    declineHint: 'A recusa devolve o pedido.',
    commissionFlat: '€5,00',
    pointsBal: 'Saldo inicial €2,50',
    euro: '€',
    splashWelcome: 'Bem-vindo à LuxServices',
    splashHello: 'Cuidado em casa, a pedido',
    splashSub: 'Reserve profissionais verificados no Luxemburgo, Alemanha e França.',
    splashDetect: 'A detetar o seu país…',
    splashDetected: 'Localizado para {country}',
    splashContinue: 'Começar',
    welcomeTo: 'Bem-vindo',
    loginTitle: 'Iniciar sessão',
    loginSub: 'Os seus serviços em casa, numa app segura.',
    email: 'E-mail',
    password: 'Palavra-passe',
    fullName: 'Nome completo',
    loginCta: 'Entrar',
    signupCta: 'Criar conta',
    signupTitle: 'Criar a sua conta',
    signupSub: 'RGPD. Nunca partilhamos telefone ou e-mail.',
    noAccount: 'Novo por aqui?',
    hasAccount: 'Já tem conta?',
    orContinue: 'ou',
    forgot: 'Precisa de uma demo?',
    demoLogin: 'Continuar com a demo',
    staffAccess: 'Equipa',
    adminPinTitle: 'Acesso admin',
    adminPinSub: 'Introduza o PIN secreto de 4 dígitos',
    enterPin: 'Introduzir PIN',
    pinWrong: 'PIN incorreto',
    pinOk: 'Acesso concedido',
    unlockAdmin: 'Abrir painel admin',
    backToLogin: 'Voltar ao início de sessão',
    detecting: 'A localizar',
    detectedAs: 'Detetado',
    localeAuto: 'Idioma definido pelo seu país',
    changeAnytime: 'Altere o idioma a qualquer momento',
    sessionAs: 'Sessão de',
    signIn: 'Entrar',
    createAccount: 'Criar conta',
    workerLogin: 'Entrar como profissional',
    customerLogin: 'Entrar como cliente',
    pinHint: 'PIN da equipa',
    secretAdmin: 'Restrito',
    marketsLive: 'Ativo em LU · DE · FR',
    splashCats: 'Popular perto de si',
    autoLang: 'Auto',
    countryFrance: 'França',
    countryGermany: 'Alemanha',
    countryLuxembourg: 'Luxemburgo',
    countryDefault: 'Europa',
    skip: 'Saltar',
    emailPh: 'voce@email.eu',
    passwordPh: '••••••••',
    namePh: 'Alex Moreau',
    invalidAuth: 'E-mail válido e palavra-passe (6+ caracteres)',
    accountReady: 'Conta pronta',
    signedIn: 'Sessão iniciada',
    pinClear: 'Limpar',
    localeManual: 'Idioma escolhido manualmente',
    detectedCountry: 'País',
    rewardsHint: 'Ganhe cashback em LuxPoints após cada pagamento. Use no checkout.',
    jobAmount: 'Valor do trabalho',
    yourPay: 'Este trabalho',
    includeInsured: 'Visita segurada',
    includeUpdates: 'Atualizações na app',
    includeAddress: 'Morada após pagamento',
    includeCashback: 'Cashback LuxPoints',
  },
  hi: {
    appName: 'LuxServices',
    tagline: 'यूरोप में ऑन-डिमांड होम सेवाएँ',
    search: 'सेवा या पास के विशेषज्ञ खोजें',
    home: 'होम',
    bookings: 'बुकिंग',
    messages: 'संदेश',
    rewards: 'रिवॉर्ड',
    profile: 'खाता',
    services: 'सेवाएँ',
    nearby: 'पास के विशेषज्ञ',
    seeAll: 'सभी',
    bookNow: 'बुक करें',
    perHour: '/घं',
    rating: 'रेटिंग',
    jobsDone: 'कार्य',
    reviews: 'समीक्षाएँ',
    language: 'भाषा',
    role: 'दृश्य',
    customer: 'ग्राहक',
    worker: 'कार्यकर्ता',
    admin: 'एडमिन',
    switchRole: 'भूमिका बदलें',
    luxPoints: 'LuxPoints',
    balance: 'शेष',
    applyPoints: 'LuxPoints लगाएँ',
    cashback: 'कैशबैक',
    howItWorks: 'कैसे काम करता है',
    cleaning: 'घर की सफाई',
    gardening: 'बागवानी',
    handyman: 'हैंडीमैन',
    painting: 'पेंटिंग',
    plumbing: 'प्लंबिंग',
    electrical: 'इलेक्ट्रिकल',
    cleaningDesc: 'रसोई, बाथरूम और कमरों की गहरी सफाई।',
    gardeningDesc: 'लॉन, हेज, रोपण और मौसमी देखभाल।',
    handymanDesc: 'मरम्मत, असेम्बली और छोटे सुधार।',
    paintingDesc: 'भीतरी दीवारें और फिनिश।',
    plumbingDesc: 'लीक, फिटिंग और इंस्टॉलेशन।',
    electricalDesc: 'सॉकेट, लाइटिंग और सुरक्षित जाँच।',
    bookService: 'यह सेवा बुक करें',
    selectDate: 'तारीख चुनें',
    selectTime: 'समय चुनें',
    duration: 'अवधि',
    hours: 'घंटे',
    hour: 'घंटा',
    address: 'पता',
    notes: 'विशेषज्ञ के लिए नोट',
    addressHidden: 'भुगतान तक पता छिपा रहेगा',
    addressRevealed: 'पता विशेषज्ञ के साथ साझा',
    gdpr: 'GDPR सुरक्षित',
    contactInApp: 'केवल LuxServices चैट से संपर्क',
    payment: 'भुगतान',
    payCard: 'कार्ड',
    applePay: 'Apple Pay',
    googlePay: 'Google Pay',
    cardNumber: 'कार्ड नंबर',
    expiry: 'MM/YY',
    cvc: 'CVC',
    pay: 'सुरक्षित भुगतान',
    processing: 'Stripe प्रोसेस हो रहा है…',
    success: 'भुगतान पुष्ट',
    confirmed: 'बुकिंग पुष्ट',
    rewardEarned: 'रिवॉर्ड जोड़ा गया',
    upcoming: 'आगामी',
    active: 'सक्रिय',
    completed: 'पूर्ण',
    cancelled: 'रद्द',
    accept: 'स्वीकार',
    reject: 'अस्वीकार',
    noBookings: 'कोई बुकिंग नहीं',
    incoming: 'आए हुए कार्य',
    income: 'आय',
    incentives: 'प्रोत्साहन',
    commission: 'प्लेटफ़ॉर्म कमीशन',
    platformFee: '€5 फ्लैट कमीशन',
    revenue: 'कुल वॉल्यूम',
    privacy: 'गोपनीयता और सुरक्षा',
    chatPh: 'इन-ऐप लिखें…',
    send: 'भेजें',
    total: 'कुल',
    subtotal: 'उप-योग',
    discount: 'LuxPoints छूट',
    markets: 'बाज़ार',
    luxembourg: 'लक्ज़मबर्ग',
    germany: 'जर्मनी',
    france: 'फ़्रांस',
    verified: 'सत्यापित',
    topRated: 'टॉप रेटेड',
    available: 'उपलब्ध',
    all: 'सभी',
    noResults: 'कोई परिणाम नहीं',
    settings: 'सेटिंग्स',
    notifications: 'सूचनाएँ',
    help: 'सहायता',
    about: 'LuxServices के बारे में',
    logout: 'डेमो रीसेट',
    welcome: 'नमस्ते',
    welcomeSub: 'LU · DE · FR में विश्वसनीय विशेषज्ञ',
    usePoints: '€{n} LuxPoints लगाएँ',
    pointsApplied: 'पॉइंट्स लागू',
    secure: 'Stripe एन्क्रिप्टेड चेकआउट',
    bookingDetails: 'बुकिंग विवरण',
    scheduled: 'निर्धारित',
    back: 'वापस',
    cancel: 'रद्द',
    confirm: 'पुष्टि',
    done: 'हो गया',
    location: 'शहर',
    cardholder: 'कार्ड पर नाम',
    workerDash: 'वर्कर डैशबोर्ड',
    adminPanel: 'एडमिन पैनल',
    customerView: 'ग्राहक दृश्य',
    today: 'आज',
    week: 'इस सप्ताह',
    month: 'इस माह',
    acceptJob: 'कार्य स्वीकारें',
    rejectJob: 'कार्य अस्वीकारें',
    users: 'लोग',
    finance: 'वित्त',
    overview: 'सारांश',
    noMessages: 'कोई बातचीत नहीं',
    startChat: 'बुकिंग के बाद संदेश',
    emptySearch: 'दूसरा शब्द आज़माएँ',
    emptyBookings: 'किसी विशेषज्ञ को बुक करें',
    commissionNote: 'हर भुगतान पर €5 कमीशन।',
    hideContact: 'फ़ोन और ईमेल निजी रहते हैं',
    inAppOnly: 'केवल इन-ऐप संचार',
    revealAfter: 'भुगतान के बाद पता',
    pointsInfo: 'हर भुगतान पर €1–€2 LuxPoints कमाएँ।',
    rewardInfo: 'ग्राहकों को €1–€2 कैशबैक मिलता है।',
    incentiveInfo: 'कार्यकर्ताओं को €1–€2 प्रोत्साहन मिलता है।',
    jobsTab: 'कार्य',
    earningsTab: 'कमाई',
    netPayout: 'नेट भुगतान',
    paid: 'भुगतान हुआ',
    pending: 'लंबित',
    rejected: 'अस्वीकृत',
    inProgress: 'प्रगति में',
    openChat: 'चैट खोलें',
    bookWorker: 'इस विशेषज्ञ को बुक करें',
    from: 'से',
    featured: 'आपके शहर में विशेष',
    apply: 'लागू करें',
    remove: 'हटाएँ',
    youSave: 'आप बचाते हैं',
    continue: 'जारी रखें',
    chooseMethod: 'भुगतान विधि चुनें',
    payAmount: 'भुगतान',
    bookingId: 'बुकिंग आईडी',
    assigned: 'नियुक्त विशेषज्ञ',
    sharedNow: 'पता अब दिखाई दे रहा है',
    protected: 'संपर्क सुरक्षित',
    stats: 'प्रदर्शन',
    ledger: 'कमीशन लेजर',
    gmv: 'कुल व्यापार',
    rewardsPaid: 'ग्राहक रिवॉर्ड',
    incentivesPaid: 'वर्कर प्रोत्साहन',
    live: 'लाइव',
    filterCity: 'शहर',
    hoursLabel: 'घंटे',
    whatsIncluded: 'शामिल',
    languagesSpoken: 'भाषाएँ',
    aboutPro: 'परिचय',
    noPhone: 'फ़ोन साझा नहीं',
    noEmail: 'ईमेल साझा नहीं',
    stripe: 'Stripe द्वारा सुरक्षित',
    applePayHint: 'Face ID / Touch ID से भुगतान',
    googlePayHint: 'Google Pay से भुगतान',
    cardHint: 'Visa, Mastercard, Maestro',
    invalidCard: '16 अंकों का वैध कार्ड नंबर',
    fillAll: 'सभी भुगतान फ़ील्ड भरें',
    fillBooking: 'तारीख, समय और पता चुनें',
    jobAccepted: 'कार्य स्वीकृत',
    jobRejected: 'कार्य अस्वीकृत',
    newRequest: 'नया अनुरोध',
    trackIncome: 'आय ट्रैक करें',
    demoUser: 'Alex Moreau',
    demoCity: 'लक्ज़मबर्ग सिटी',
    saved: 'सहेजा गया',
    refresh: 'अपडेट',
    adminUsers: 'उपयोगकर्ता और विशेषज्ञ',
    adminBookings: 'सभी बुकिंग',
    customerReward: 'ग्राहक रिवॉर्ड',
    workerIncentive: 'वर्कर प्रोत्साहन',
    platformKeep: 'प्लेटफ़ॉर्म रखता है',
    workerNet: 'कार्यकर्ता पाता है',
    afterPay: 'भुगतान के बाद',
    chatSecure: 'सुरक्षित इन-ऐप संदेश',
    writeHere: 'संदेश लिखें',
    todayJobs: 'आज के कार्य',
    availableNow: 'अभी उपलब्ध',
    offline: 'ऑफ़लाइन',
    selectService: 'सेवा चुनें',
    popular: 'इस सप्ताह लोकप्रिय',
    trust: 'बीमित · जाँच · GDPR',
    pointsShort: 'अंक',
    useReward: 'चेकआउट पर उपयोग',
    history: 'इतिहास',
    howTitle: 'वित्तीय प्रवाह',
    how1: 'ग्राहक घंटा दर × घंटे चुकाता है।',
    how2: 'वैकल्पिक LuxPoints छूट।',
    how3: 'ग्राहक को €1–€2 कैशबैक।',
    how4: 'कार्यकर्ता को €1–€2 प्रोत्साहन।',
    how5: 'प्लेटफ़ॉर्म को €5 फ्लैट कमीशन।',
    manage: 'प्रबंधन',
    roleHint: 'मार्केटप्लेस के हर पक्ष देखें।',
    marketHint: 'लक्ज़मबर्ग, जर्मनी और फ़्रांस में सक्रिय।',
    logoutDone: 'डेमो रीसेट',
    notificationsOn: 'कार्य और चैट अलर्ट',
    helpBody: 'चैट से सहायता। फ़ोन/ईमेल साझा नहीं।',
    aboutBody: 'LuxServices, LU, DE और FR के लिए होम प्लेटफ़ॉर्म।',
    tapPay: 'भुगतान के लिए टैप',
    confirmPay: 'पुष्टि कर भुगतान करें',
    paidWith: 'से भुगतान',
    remainingPoints: 'शेष LuxPoints',
    earned: 'कमाया',
    spent: 'इस्तेमाल',
    open: 'खोलें',
    none: 'अभी कुछ नहीं',
    workerView: 'वर्कर व्यू',
    adminView: 'एडमिन व्यू',
    homeTab: 'होम',
    searchLive: 'लाइव परिणाम',
    nearbyShort: 'पास',
    bookTitle: 'शेड्यूल',
    payTitle: 'सुरक्षित चेकआउट',
    doneTitle: 'बुक हो गया',
    chatTitle: 'सुरक्षित चैट',
    profileTitle: 'खाता',
    rewardsTitle: 'LuxPoints',
    jobsTitle: 'जॉब बोर्ड',
    earnTitle: 'आय',
    adminTitle: 'कंट्रोल सेंटर',
    finTitle: 'वित्त',
    peopleTitle: 'निर्देशिका',
    serviceTitle: 'सेवा',
    proTitle: 'विशेषज्ञ',
    cancelBooking: 'बुकिंग रद्द',
    keep: 'रखें',
    cancelledOk: 'बुकिंग रद्द',
    status: 'स्थिति',
    when: 'कब',
    where: 'कहाँ',
    price: 'कीमत',
    rate: 'दर',
    method: 'विधि',
    card: 'कार्ड',
    hiddenUntil: 'भुगतान पुष्टि तक छिपा',
    unlocks: 'Stripe के बाद खुलेगा',
    msgPro: 'विशेषज्ञ को संदेश',
    msgCustomer: 'ग्राहक को संदेश',
    acceptHint: 'स्वीकृति ग्राहक को सूचित करती है।',
    declineHint: 'अस्वीकृति अनुरोध वापस करती है।',
    commissionFlat: '€5.00',
    pointsBal: 'प्रारंभिक शेष €2.50',
    euro: '€',
    splashWelcome: 'LuxServices में स्वागत है',
    splashHello: 'विश्वसनीय होम केयर, ऑन डिमांड',
    splashSub: 'लक्ज़मबर्ग, जर्मनी और फ़्रांस में सत्यापित विशेषज्ञ बुक करें।',
    splashDetect: 'आपका देश पहचाना जा रहा है…',
    splashDetected: '{country} के लिए स्थानीयकृत',
    splashContinue: 'शुरू करें',
    welcomeTo: 'स्वागत है',
    loginTitle: 'साइन इन',
    loginSub: 'आपकी होम सेवाएँ, एक सुरक्षित ऐप में।',
    email: 'ईमेल',
    password: 'पासवर्ड',
    fullName: 'पूरा नाम',
    loginCta: 'साइन इन',
    signupCta: 'खाता बनाएँ',
    signupTitle: 'अपना खाता बनाएँ',
    signupSub: 'GDPR सुरक्षित। फ़ोन या ईमेल साझा नहीं।',
    noAccount: 'नए हैं?',
    hasAccount: 'पहले से खाता है?',
    orContinue: 'या',
    forgot: 'डेमो चाहिए?',
    demoLogin: 'डेमो से जारी रखें',
    staffAccess: 'स्टाफ़',
    adminPinTitle: 'एडमिन एक्सेस',
    adminPinSub: 'गुप्त 4-अंक PIN दर्ज करें',
    enterPin: 'PIN दर्ज करें',
    pinWrong: 'गलत PIN',
    pinOk: 'पहुँच स्वीकृत',
    unlockAdmin: 'एडमिन पैनल खोलें',
    backToLogin: 'साइन इन पर वापस',
    detecting: 'स्थान खोजा जा रहा है',
    detectedAs: 'पहचाना गया',
    localeAuto: 'भाषा आपके देश से सेट',
    changeAnytime: 'भाषा कभी भी बदलें',
    sessionAs: 'साइन इन',
    signIn: 'साइन इन',
    createAccount: 'खाता बनाएँ',
    workerLogin: 'विशेषज्ञ के रूप में जुड़ें',
    customerLogin: 'ग्राहक के रूप में जुड़ें',
    pinHint: 'स्टाफ़ PIN',
    secretAdmin: 'प्रतिबंधित',
    marketsLive: 'LU · DE · FR में लाइव',
    splashCats: 'आपके पास लोकप्रिय',
    autoLang: 'ऑटो',
    countryFrance: 'फ़्रांस',
    countryGermany: 'जर्मनी',
    countryLuxembourg: 'लक्ज़मबर्ग',
    countryDefault: 'यूरोप',
    skip: 'छोड़ें',
    emailPh: 'you@email.eu',
    passwordPh: '••••••••',
    namePh: 'Alex Moreau',
    invalidAuth: 'वैध ईमेल और पासवर्ड (6+ अक्षर)',
    accountReady: 'खाता तैयार',
    signedIn: 'साइन इन हुआ',
    pinClear: 'साफ़',
    localeManual: 'भाषा मैन्युअल चुनी गई',
    detectedCountry: 'देश',
    rewardsHint: 'हर भुगतान के बाद LuxPoints कैशबैक कमाएँ। चेकआउट पर छूट के रूप में उपयोग करें।',
    jobAmount: 'कार्य राशि',
    yourPay: 'यह कार्य',
    includeInsured: 'बीमित विज़िट',
    includeUpdates: 'इन-ऐप अपडेट',
    includeAddress: 'भुगतान के बाद पता',
    includeCashback: 'LuxPoints कैशबैक',
  },
};

const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { id: 'fr', label: 'Français', flag: '🇫🇷' },
  { id: 'pt', label: 'Português', flag: '🇵🇹' },
  { id: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
];

const CITIES = [
  { id: 'lux', name: 'Luxembourg City', market: 'luxembourg', country: 'LU' },
  { id: 'esch', name: 'Esch-sur-Alzette', market: 'luxembourg', country: 'LU' },
  { id: 'berlin', name: 'Berlin', market: 'germany', country: 'DE' },
  { id: 'munich', name: 'Munich', market: 'germany', country: 'DE' },
  { id: 'paris', name: 'Paris', market: 'france', country: 'FR' },
  { id: 'lyon', name: 'Lyon', market: 'france', country: 'FR' },
];

interface Review {
  author: string;
  text: string;
  stars: number;
}

interface Worker {
  id: string;
  name: string;
  serviceId: ServiceId;
  rating: number;
  jobs: number;
  cityId: string;
  bio: string;
  langs: string[];
  reviews: Review[];
  available: boolean;
  initials: string;
  accent: string;
}

interface Booking {
  id: string;
  serviceId: ServiceId;
  workerId: string;
  customerName: string;
  date: string;
  time: string;
  hours: number;
  address: string;
  notes: string;
  status: BookingStatus;
  paid: boolean;
  rate: number;
  subtotal: number;
  pointsUsed: number;
  total: number;
  customerReward: number;
  workerIncentive: number;
  commission: number;
  payMethod?: PayMethod;
  createdAt: number;
  cityId: string;
}

interface ChatMsg {
  id: string;
  from: 'me' | 'them';
  text: string;
  ts: number;
}

interface Conversation {
  id: string;
  workerId: string;
  bookingId?: string;
  last: string;
  messages: ChatMsg[];
}

interface PointEvent {
  id: string;
  label: string;
  amount: number;
  ts: number;
}

const WORKERS: Worker[] = [
  {
    id: 'w1',
    name: 'Marie Dubois',
    serviceId: 'cleaning',
    rating: 4.9,
    jobs: 312,
    cityId: 'lux',
    bio: 'Detail-focused cleaner for apartments and offices around Kirchberg and Limpertsberg.',
    langs: ['FR', 'DE', 'EN'],
    reviews: [
      { author: 'P. Weber', text: 'Spotless kitchen in two hours.', stars: 5 },
      { author: 'A. Rossi', text: 'Punctual and careful with antiques.', stars: 5 },
    ],
    available: true,
    initials: 'MD',
    accent: '#007BFF',
  },
  {
    id: 'w2',
    name: 'Klaus Weber',
    serviceId: 'gardening',
    rating: 4.8,
    jobs: 198,
    cityId: 'berlin',
    bio: 'Landscape gardener specialising in compact city gardens and balcony greening.',
    langs: ['DE', 'EN'],
    reviews: [{ author: 'S. Klein', text: 'Hedges look architectural now.', stars: 5 }],
    available: true,
    initials: 'KW',
    accent: '#0B6EDC',
  },
  {
    id: 'w3',
    name: 'Jean-Pierre Martin',
    serviceId: 'handyman',
    rating: 4.7,
    jobs: 256,
    cityId: 'paris',
    bio: 'Flat-pack assembly, TV mounting and small repairs across the 11th and 20th.',
    langs: ['FR', 'EN'],
    reviews: [{ author: 'C. Bernard', text: 'Shelves perfectly level.', stars: 5 }],
    available: true,
    initials: 'JM',
    accent: '#0056D6',
  },
  {
    id: 'w4',
    name: 'Sofia Almeida',
    serviceId: 'painting',
    rating: 4.9,
    jobs: 141,
    cityId: 'lux',
    bio: 'Clean interior painting with low-VOC finishes, ideal for family homes.',
    langs: ['PT', 'FR', 'EN'],
    reviews: [{ author: 'L. Schmit', text: 'Colour match was exact.', stars: 5 }],
    available: true,
    initials: 'SA',
    accent: '#0066E0',
  },
  {
    id: 'w5',
    name: 'Lukas Schneider',
    serviceId: 'plumbing',
    rating: 4.8,
    jobs: 274,
    cityId: 'munich',
    bio: 'Certified plumber for leaks, mixers and bathroom fittings.',
    langs: ['DE', 'EN'],
    reviews: [{ author: 'H. Bauer', text: 'Fixed a hidden leak the same day.', stars: 5 }],
    available: true,
    initials: 'LS',
    accent: '#007BFF',
  },
  {
    id: 'w6',
    name: 'Camille Laurent',
    serviceId: 'electrical',
    rating: 4.9,
    jobs: 188,
    cityId: 'lyon',
    bio: 'Licensed electrician for lighting plans, EV-ready sockets and safety checks.',
    langs: ['FR', 'EN'],
    reviews: [{ author: 'N. Petit', text: 'Whole-flat lighting upgrade, immaculate.', stars: 5 }],
    available: true,
    initials: 'CL',
    accent: '#004CBA',
  },
  {
    id: 'w7',
    name: 'Amélie Hoffmann',
    serviceId: 'cleaning',
    rating: 4.6,
    jobs: 97,
    cityId: 'esch',
    bio: 'Eco-friendly home cleaning for families in the south of Luxembourg.',
    langs: ['DE', 'FR', 'EN'],
    reviews: [{ author: 'T. Krier', text: 'Kids’ rooms were transformed.', stars: 4 }],
    available: true,
    initials: 'AH',
    accent: '#1A7CFF',
  },
  {
    id: 'w8',
    name: 'Noah Fischer',
    serviceId: 'handyman',
    rating: 4.5,
    jobs: 163,
    cityId: 'berlin',
    bio: 'Furniture assembly and door adjustments, evenings available.',
    langs: ['DE', 'EN'],
    reviews: [{ author: 'M. Lang', text: 'Quiet, fast, tidy.', stars: 5 }],
    available: false,
    initials: 'NF',
    accent: '#0062CC',
  },
  {
    id: 'w9',
    name: 'Élodie Renard',
    serviceId: 'gardening',
    rating: 4.8,
    jobs: 121,
    cityId: 'paris',
    bio: 'Courtyard gardens and herb planters for Haussmann buildings.',
    langs: ['FR', 'EN'],
    reviews: [{ author: 'J. Morel', text: 'Our courtyard smells of thyme.', stars: 5 }],
    available: true,
    initials: 'ER',
    accent: '#0070E8',
  },
  {
    id: 'w10',
    name: 'Pierre Kayser',
    serviceId: 'electrical',
    rating: 4.7,
    jobs: 209,
    cityId: 'lux',
    bio: 'Residential electrics and smart lighting for Luxembourg City homes.',
    langs: ['FR', 'DE', 'EN'],
    reviews: [{ author: 'I. Wagner', text: 'Safe, documented, on time.', stars: 5 }],
    available: true,
    initials: 'PK',
    accent: '#005BBB',
  },
];

const seedBookings = (): Booking[] => [
  {
    id: 'B-10482',
    serviceId: 'cleaning',
    workerId: 'w1',
    customerName: 'Alex Moreau',
    date: offsetDate(2),
    time: '10:00',
    hours: 3,
    address: '12 Rue Aldringen, 1118 Luxembourg',
    notes: 'Please focus on the kitchen tiles.',
    status: 'accepted',
    paid: true,
    rate: 20,
    subtotal: 60,
    pointsUsed: 0,
    total: 60,
    customerReward: 2,
    workerIncentive: 1,
    commission: 5,
    payMethod: 'card',
    createdAt: Date.now() - 86400000 * 3,
    cityId: 'lux',
  },
  {
    id: 'B-10311',
    serviceId: 'plumbing',
    workerId: 'w5',
    customerName: 'Alex Moreau',
    date: offsetDate(-6),
    time: '14:00',
    hours: 2,
    address: '8 Avenue de la Liberté, 1930 Luxembourg',
    notes: '',
    status: 'completed',
    paid: true,
    rate: 30,
    subtotal: 60,
    pointsUsed: 2.5,
    total: 57.5,
    customerReward: 1,
    workerIncentive: 2,
    commission: 5,
    payMethod: 'apple',
    createdAt: Date.now() - 86400000 * 8,
    cityId: 'lux',
  },
  {
    id: 'B-10501',
    serviceId: 'gardening',
    workerId: 'w2',
    customerName: 'Helena Vogt',
    date: offsetDate(1),
    time: '09:00',
    hours: 4,
    address: 'Prenzlauer Allee 48, 10405 Berlin',
    notes: 'Hedge trim + lawn.',
    status: 'pending',
    paid: true,
    rate: 22,
    subtotal: 88,
    pointsUsed: 0,
    total: 88,
    customerReward: 2,
    workerIncentive: 1,
    commission: 5,
    payMethod: 'google',
    createdAt: Date.now() - 3600000,
    cityId: 'berlin',
  },
];

const seedConversations = (): Conversation[] => [
  {
    id: 'c1',
    workerId: 'w1',
    bookingId: 'B-10482',
    last: 'I will arrive at 09:50.',
    messages: [
      { id: 'm1', from: 'me', text: 'Hi Marie, the door code is shared after payment — now confirmed.', ts: Date.now() - 86000000 },
      { id: 'm2', from: 'them', text: 'Thank you. I will arrive at 09:50.', ts: Date.now() - 85000000 },
      { id: 'm3', from: 'me', text: 'Kitchen is the priority, as noted.', ts: Date.now() - 84000000 },
    ],
  },
];

const seedPoints = (): PointEvent[] => [
  { id: 'p1', label: 'Welcome balance', amount: 2.5, ts: Date.now() - 86400000 * 20 },
  { id: 'p2', label: 'Cashback · Plumbing B-10311', amount: 1, ts: Date.now() - 86400000 * 8 },
  { id: 'p3', label: 'Redeemed · Plumbing B-10311', amount: -2.5, ts: Date.now() - 86400000 * 8 },
];

function offsetDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function euro(n: number) {
  return `€${n.toFixed(2)}`;
}

function maskAddress(addr: string) {
  const city = addr.split(',').slice(-1)[0]?.trim() || 'City';
  return `•••• ••••, ${city}`;
}

function nextDays(n: number) {
  const out: { key: string; d: number; mon: string; label: string }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({
      key: d.toISOString().slice(0, 10),
      d: d.getDate(),
      mon: d.toLocaleString('en-GB', { month: 'short' }),
      label: i === 0 ? '•' : d.toLocaleString('en-GB', { weekday: 'short' }),
    });
  }
  return out;
}

const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function cityById(id: string) {
  return CITIES.find((c) => c.id === id) || CITIES[0];
}

function workerById(id: string) {
  return WORKERS.find((w) => w.id === id);
}

const ADMIN_PIN = '2468';

function countryLabel(cc: string, t: (k: string) => string) {
  if (cc === 'FR') return t('countryFrance');
  if (cc === 'DE' || cc === 'AT') return t('countryGermany');
  if (cc === 'LU') return t('countryLuxembourg');
  return t('countryDefault');
}

function langFromCountry(cc: string): Lang {
  const c = cc.toUpperCase();
  if (c === 'FR') return 'fr';
  if (c === 'DE' || c === 'AT') return 'de';
  if (c === 'PT' || c === 'BR') return 'pt';
  if (c === 'IN') return 'hi';
  return 'en';
}

function cityFromCountry(cc: string): string {
  const c = cc.toUpperCase();
  if (c === 'FR') return 'paris';
  if (c === 'DE') return 'berlin';
  if (c === 'AT') return 'munich';
  if (c === 'LU') return 'lux';
  return 'lux';
}

function guessFromTimezone(): { lang: Lang; cityId: string; country: string } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz === 'Europe/Paris' || tz.includes('Paris')) return { lang: 'fr', cityId: 'paris', country: 'FR' };
    if (tz === 'Europe/Berlin' || tz.includes('Berlin')) return { lang: 'de', cityId: 'berlin', country: 'DE' };
    if (tz.includes('Munich') || tz === 'Europe/Vienna') return { lang: 'de', cityId: 'munich', country: 'DE' };
    if (tz === 'Europe/Luxembourg' || tz.includes('Luxembourg')) return { lang: 'en', cityId: 'lux', country: 'LU' };
    if (tz === 'Europe/Lisbon') return { lang: 'pt', cityId: 'lux', country: 'PT' };
    if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('Delhi')) return { lang: 'hi', cityId: 'lux', country: 'IN' };
  } catch {}
  return { lang: 'en', cityId: 'lux', country: 'LU' };
}

async function detectLocale(): Promise<{ lang: Lang; cityId: string; country: string; source: string }> {
  try {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 2800) : undefined;
    const r = await fetch('https://ipapi.co/json/', ctrl ? { signal: ctrl.signal } : undefined);
    if (timer) clearTimeout(timer);
    if (r.ok) {
      const j = await r.json();
      const cc = String(j.country_code || j.country || '').toUpperCase();
      if (cc && cc !== 'UNDEFINED') {
        return { lang: langFromCountry(cc), cityId: cityFromCountry(cc), country: cc, source: 'ip' };
      }
    }
  } catch {}
  try {
    const loc =
      (typeof navigator !== 'undefined' && (navigator.language || (navigator as { userLanguage?: string }).userLanguage)) || '';
    const tz = guessFromTimezone();
    if (tz.country === 'FR' || tz.country === 'DE' || tz.country === 'LU') {
      return { ...tz, source: 'tz' };
    }
    if (loc.toLowerCase().startsWith('fr')) return { lang: 'fr', cityId: 'paris', country: 'FR', source: 'locale' };
    if (loc.toLowerCase().startsWith('de')) return { lang: 'de', cityId: 'berlin', country: 'DE', source: 'locale' };
    return { ...tz, source: 'tz' };
  } catch {}
  return { lang: 'en', cityId: 'lux', country: 'LU', source: 'default' };
}

interface SessionUser {
  name: string;
  email: string;
}

interface AppState {
  lang: Lang;
  role: Role;
  cityId: string;
  luxPoints: number;
  bookings: Booking[];
  convos: Conversation[];
  pointsLog: PointEvent[];
  stack: Screen[];
  serviceId?: ServiceId;
  workerId?: string;
  bookingDraft: {
    serviceId?: ServiceId;
    workerId?: string;
    date: string;
    time: string;
    hours: number;
    address: string;
    notes: string;
    usePoints: boolean;
  };
  lastPaidId?: string;
  threadId?: string;
  toast: string;
  authGate: AuthGate;
  session: SessionUser | null;
  detectedCountry: string;
  detecting: boolean;
  langManual: boolean;
  setLang: (l: Lang) => void;
  setRole: (r: Role) => void;
  setCity: (id: string) => void;
  setAuthGate: (g: AuthGate) => void;
  signIn: (name: string, email: string, asRole?: Role) => void;
  unlockAdmin: () => void;
  push: (s: Screen, extra?: Partial<Pick<AppState, 'serviceId' | 'workerId' | 'threadId' | 'lastPaidId'>>) => void;
  pop: () => void;
  goTab: (s: Screen) => void;
  openService: (id: ServiceId) => void;
  openWorker: (id: string) => void;
  startBook: (serviceId: ServiceId, workerId: string) => void;
  updateDraft: (p: Partial<AppState['bookingDraft']>) => void;
  completePayment: (method: PayMethod) => Booking | null;
  acceptJob: (id: string) => void;
  rejectJob: (id: string) => void;
  cancelBooking: (id: string) => void;
  sendMessage: (convoId: string, text: string) => void;
  openThread: (convoId: string) => void;
  ensureThread: (workerId: string, bookingId?: string) => string;
  resetDemo: () => void;
  showToast: (m: string) => void;
  t: (k: string) => string;
}

const Ctx = createContext<AppState>(null as unknown as AppState);

function useApp() {
  return useContext(Ctx);
}

const STORAGE_KEY = 'luxservices.v2';

function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');
  const [role, setRoleState] = useState<Role>('customer');
  const [cityId, setCityState] = useState('lux');
  const [luxPoints, setLuxPoints] = useState(2.5);
  const [bookings, setBookings] = useState<Booking[]>(seedBookings);
  const [convos, setConvos] = useState<Conversation[]>(seedConversations);
  const [pointsLog, setPointsLog] = useState<PointEvent[]>(seedPoints);
  const [stack, setStack] = useState<Screen[]>(['home']);
  const [serviceId, setServiceId] = useState<ServiceId | undefined>();
  const [workerId, setWorkerId] = useState<string | undefined>();
  const [lastPaidId, setLastPaidId] = useState<string | undefined>();
  const [threadId, setThreadId] = useState<string | undefined>();
  const [toast, setToast] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [authGate, setAuthGateState] = useState<AuthGate>('splash');
  const [session, setSession] = useState<SessionUser | null>(null);
  const [detectedCountry, setDetectedCountry] = useState('LU');
  const [detecting, setDetecting] = useState(true);
  const [langManual, setLangManual] = useState(false);
  const [bookingDraft, setBookingDraft] = useState<AppState['bookingDraft']>({
    date: offsetDate(1),
    time: '10:00',
    hours: 2,
    address: '',
    notes: '',
    usePoints: false,
  });

  useEffect(() => {
    (async () => {
      let storedManual = false;
      let storedLang: Lang | null = null;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          if (d.lang) {
            storedLang = d.lang;
            setLangState(d.lang);
          }
          if (d.role) setRoleState(d.role);
          if (d.cityId) setCityState(d.cityId);
          if (typeof d.luxPoints === 'number') setLuxPoints(d.luxPoints);
          if (d.bookings) setBookings(d.bookings);
          if (d.convos) setConvos(d.convos);
          if (d.pointsLog) setPointsLog(d.pointsLog);
          if (d.session) setSession(d.session);
          if (d.langManual) {
            storedManual = true;
            setLangManual(true);
          }
        }
      } catch {}
      try {
        const loc = await detectLocale();
        setDetectedCountry(loc.country);
        if (!storedManual) {
          setLangState(loc.lang);
          setCityState((prev) => (prev && storedLang ? prev : loc.cityId));
        }
      } catch {
        setDetectedCountry('LU');
      }
      setDetecting(false);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lang, role, cityId, luxPoints, bookings, convos, pointsLog, session, langManual })
    ).catch(() => {});
  }, [hydrated, lang, role, cityId, luxPoints, bookings, convos, pointsLog, session, langManual]);

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2200);
  }, []);

  const t = useCallback(
    (k: string) => I18N[lang][k] || I18N.en[k] || k,
    [lang]
  );

  const setLang = (l: Lang) => {
    setLangState(l);
    setLangManual(true);
    showToast(I18N[l].saved);
  };
  const setRole = (r: Role) => {
    setRoleState(r);
    const home: Screen = r === 'customer' ? 'home' : r === 'worker' ? 'jobs' : 'adminHome';
    setStack([home]);
  };
  const setCity = (id: string) => setCityState(id);
  const setAuthGate = (g: AuthGate) => setAuthGateState(g);
  const signIn = (name: string, email: string, asRole: Role = 'customer') => {
    setSession({ name, email });
    setRoleState(asRole);
    setStack([asRole === 'worker' ? 'jobs' : asRole === 'admin' ? 'adminHome' : 'home']);
    setAuthGateState('app');
    showToast(I18N[lang].signedIn);
  };
  const unlockAdmin = () => {
    setSession({ name: 'Lux Admin', email: 'ops@luxservices.eu' });
    setRoleState('admin');
    setStack(['adminHome']);
    setAuthGateState('app');
    showToast(I18N[lang].pinOk);
  };

  const push = (s: Screen, extra?: Partial<Pick<AppState, 'serviceId' | 'workerId' | 'threadId' | 'lastPaidId'>>) => {
    if (extra?.serviceId) setServiceId(extra.serviceId);
    if (extra?.workerId) setWorkerId(extra.workerId);
    if (extra?.threadId) setThreadId(extra.threadId);
    if (extra?.lastPaidId) setLastPaidId(extra.lastPaidId);
    setStack((prev) => [...prev, s]);
  };
  const pop = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  const goTab = (s: Screen) => setStack([s]);

  const openService = (id: ServiceId) => {
    setServiceId(id);
    setStack((p) => [...p, 'service']);
  };
  const openWorker = (id: string) => {
    setWorkerId(id);
    setStack((p) => [...p, 'worker']);
  };
  const startBook = (sid: ServiceId, wid: string) => {
    setBookingDraft((d) => ({
      ...d,
      serviceId: sid,
      workerId: wid,
      date: d.date || offsetDate(1),
      time: d.time || '10:00',
      hours: d.hours || 2,
    }));
    setServiceId(sid);
    setWorkerId(wid);
    setStack((p) => [...p, 'book']);
  };
  const updateDraft = (p: Partial<AppState['bookingDraft']>) => setBookingDraft((d) => ({ ...d, ...p }));

  const completePayment = (method: PayMethod): Booking | null => {
    const sid = bookingDraft.serviceId;
    const wid = bookingDraft.workerId;
    if (!sid || !wid || !bookingDraft.date || !bookingDraft.time || !bookingDraft.address.trim()) return null;
    const rate = PRICES[sid];
    const subtotal = rate * bookingDraft.hours;
    const pointsUsed = bookingDraft.usePoints ? Math.min(luxPoints, subtotal) : 0;
    const total = Math.max(0, +(subtotal - pointsUsed).toFixed(2));
    const customerReward = Math.random() > 0.5 ? 2 : 1;
    const workerIncentive = Math.random() > 0.5 ? 2 : 1;
    const booking: Booking = {
      id: uid('B'),
      serviceId: sid,
      workerId: wid,
      customerName: 'Alex Moreau',
      date: bookingDraft.date,
      time: bookingDraft.time,
      hours: bookingDraft.hours,
      address: bookingDraft.address.trim(),
      notes: bookingDraft.notes,
      status: 'pending',
      paid: true,
      rate,
      subtotal,
      pointsUsed,
      total,
      customerReward,
      workerIncentive,
      commission: 5,
      payMethod: method,
      createdAt: Date.now(),
      cityId,
    };
    setBookings((b) => [booking, ...b]);
    setLuxPoints((p) => +(p - pointsUsed + customerReward).toFixed(2));
    setPointsLog((log) => [
      {
        id: uid('P'),
        label: `Cashback · ${I18N[lang][sid]} ${booking.id}`,
        amount: customerReward,
        ts: Date.now(),
      },
      ...(pointsUsed
        ? [{ id: uid('P'), label: `Redeemed · ${booking.id}`, amount: -pointsUsed, ts: Date.now() }]
        : []),
      ...log,
    ]);
    const existing = convos.find((c) => c.workerId === wid);
    if (existing) {
      setConvos((cs) =>
        cs.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                bookingId: booking.id,
                last: 'Booking confirmed. Address is now visible.',
                messages: [
                  ...c.messages,
                  {
                    id: uid('M'),
                    from: 'them',
                    text: 'Thanks — I can now see the exact address after payment.',
                    ts: Date.now(),
                  },
                ],
              }
            : c
        )
      );
    } else {
      setConvos((cs) => [
        {
          id: uid('C'),
          workerId: wid,
          bookingId: booking.id,
          last: 'Booking confirmed.',
          messages: [
            {
              id: uid('M'),
              from: 'them',
              text: 'Hello! Your booking is confirmed. I can see the address now.',
              ts: Date.now(),
            },
          ],
        },
        ...cs,
      ]);
    }
    setLastPaidId(booking.id);
    return booking;
  };

  const acceptJob = (id: string) => {
    setBookings((b) => b.map((x) => (x.id === id ? { ...x, status: 'accepted' } : x)));
    showToast(t('jobAccepted'));
  };
  const rejectJob = (id: string) => {
    setBookings((b) => b.map((x) => (x.id === id ? { ...x, status: 'rejected' } : x)));
    showToast(t('jobRejected'));
  };
  const cancelBooking = (id: string) => {
    setBookings((b) => b.map((x) => (x.id === id ? { ...x, status: 'cancelled' } : x)));
    showToast(t('cancelledOk'));
  };
  const sendMessage = (convoId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setConvos((cs) =>
      cs.map((c) =>
        c.id === convoId
          ? {
              ...c,
              last: trimmed,
              messages: [...c.messages, { id: uid('M'), from: 'me', text: trimmed, ts: Date.now() }],
            }
          : c
      )
    );
  };
  const openThread = (id: string) => {
    setThreadId(id);
    setStack((p) => [...p, 'thread']);
  };
  const ensureThread = (wid: string, bookingId?: string) => {
    const found = convos.find((c) => c.workerId === wid);
    if (found) {
      setThreadId(found.id);
      return found.id;
    }
    const id = uid('C');
    setConvos((cs) => [
      { id, workerId: wid, bookingId, last: '', messages: [] },
      ...cs,
    ]);
    setThreadId(id);
    return id;
  };
  const resetDemo = () => {
    setRoleState('customer');
    setLuxPoints(2.5);
    setBookings(seedBookings());
    setConvos(seedConversations());
    setPointsLog(seedPoints());
    setStack(['home']);
    setSession(null);
    setAuthGateState('splash');
    showToast(I18N[lang].logoutDone);
  };

  const value: AppState = {
    lang,
    role,
    cityId,
    luxPoints,
    bookings,
    convos,
    pointsLog,
    stack,
    serviceId,
    workerId,
    bookingDraft,
    lastPaidId,
    threadId,
    toast,
    authGate,
    session,
    detectedCountry,
    detecting,
    langManual,
    setLang,
    setRole,
    setCity,
    setAuthGate,
    signIn,
    unlockAdmin,
    push,
    pop,
    goTab,
    openService,
    openWorker,
    startBook,
    updateDraft,
    completePayment,
    acceptJob,
    rejectJob,
    cancelBooking,
    sendMessage,
    openThread,
    ensureThread,
    resetDemo,
    showToast,
    t,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function Icon({ name, size = 20, color = C.ink }: { name: keyof typeof Ionicons.glyphMap; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function BlueHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.headerBtn} hitSlop={10}>
            <Icon name="chevron-back" size={22} color={C.white} />
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={[styles.headerBtn, { width: 72, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }]}>
          {right}
          <LangSwitcher light />
        </View>
      </View>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  dark,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  dark?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryBtn,
        dark && { backgroundColor: C.black },
        pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
        disabled && { opacity: 0.45 },
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={C.white} /> : null}
      <Text style={styles.primaryBtnTxt}>{label}</Text>
    </Pressable>
  );
}

function GhostButton({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ghostBtn, danger && { borderColor: C.danger }, pressed && { opacity: 0.8 }]}
    >
      <Text style={[styles.ghostBtnTxt, danger && { color: C.danger }]}>{label}</Text>
    </Pressable>
  );
}

function Badge({ text, soft }: { text: string; soft?: boolean }) {
  return (
    <View style={[styles.badge, soft && styles.badgeSoft]}>
      <Text style={[styles.badgeTxt, soft && { color: C.blue }]}>{text}</Text>
    </View>
  );
}

function PriceTag({ amount }: { amount: number }) {
  const { t } = useApp();
  return (
    <View style={styles.priceTag}>
      <Text style={styles.priceTagTxt}>
        €{amount}
        {t('perHour')}
      </Text>
    </View>
  );
}

function Avatar({ initials, size = 48, accent = C.blue }: { initials: string; size?: number; accent?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: C.blueSoft,
        borderWidth: 2,
        borderColor: accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: C.blue, fontWeight: '800', fontSize: size * 0.34 }}>{initials}</Text>
    </View>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name={i <= Math.round(n) ? 'star' : 'star-outline'} size={12} color={C.blue} />
      ))}
      <Text style={styles.starN}>{n.toFixed(1)}</Text>
    </View>
  );
}

function Empty({ icon, title, sub }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub?: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={28} color={C.blue} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {sub ? <Text style={styles.emptySub}>{sub}</Text> : null}
    </View>
  );
}

function ToastHost() {
  const { toast } = useApp();
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!toast) return;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [toast, opacity]);
  if (!toast) return null;
  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.toastTxt}>{toast}</Text>
    </Animated.View>
  );
}

function TabBar() {
  const { role, goTab, stack, t, convos, bookings } = useApp();
  const insets = useSafeAreaInsets();
  const current = stack[0];
  const unread = convos.some((c) => c.messages.some((m) => m.from === 'them'));
  const pendingJobs = bookings.filter((b) => b.status === 'pending' && b.paid).length;

  type TabItem = {
    id: Screen;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    dot?: boolean;
    badge?: number;
  };
  const items: TabItem[] =
    role === 'customer'
      ? [
          { id: 'home', icon: 'home', label: t('homeTab') },
          { id: 'bookings', icon: 'calendar', label: t('bookings') },
          { id: 'chat', icon: 'chatbubbles', label: t('messages'), dot: unread },
          { id: 'rewards', icon: 'gift', label: t('rewards') },
          { id: 'profile', icon: 'person', label: t('profile') },
        ]
      : role === 'worker'
      ? [
          { id: 'jobs', icon: 'briefcase', label: t('jobsTab'), badge: pendingJobs },
          { id: 'earnings', icon: 'trending-up', label: t('earningsTab') },
          { id: 'chat', icon: 'chatbubbles', label: t('messages') },
          { id: 'profile', icon: 'person', label: t('profile') },
        ]
      : [
          { id: 'adminHome', icon: 'grid', label: t('overview') },
          { id: 'adminFinance', icon: 'stats-chart', label: t('finance') },
          { id: 'adminUsers', icon: 'people', label: t('users') },
          { id: 'profile', icon: 'person', label: t('profile') },
        ];

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map((it) => {
        const active = current === it.id && stack.length === 1;
        return (
          <Pressable key={it.id} onPress={() => goTab(it.id)} style={styles.tabItem}>
            <View>
              <Icon name={active ? it.icon : (`${it.icon}-outline` as keyof typeof Ionicons.glyphMap)} size={22} color={active ? C.blue : C.mute} />
              {it.dot ? <View style={styles.dot} /> : null}
              {'badge' in it && it.badge ? (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeTxt}>{it.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tabLbl, active && { color: C.blue, fontWeight: '700' }]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HomeScreen() {
  const { t, cityId, setCity, luxPoints, openService, openWorker, push, session, detectedCountry, langManual } = useApp();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<ServiceId | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const city = cityById(cityId);
  const greetName = (session?.name || t('demoUser')).split(' ')[0];

  const query = q.trim().toLowerCase();
  const services = SERVICE_IDS.filter((id) => {
    if (cat !== 'all' && id !== cat) return false;
    if (!query) return true;
    return (
      t(id).toLowerCase().includes(query) ||
      t(`${id}Desc`).toLowerCase().includes(query) ||
      String(PRICES[id]).includes(query)
    );
  });
  const workers = WORKERS.filter((w) => {
    if (cat !== 'all' && w.serviceId !== cat) return false;
    const hitCity = !query || cityById(w.cityId).name.toLowerCase().includes(query) || w.name.toLowerCase().includes(query) || t(w.serviceId).toLowerCase().includes(query);
    return hitCity;
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  return (
    <View style={styles.flex}>
      <BlueHeader title={t('appName')} subtitle={t('tagline')} />
      <FlatList
        data={services}
        keyExtractor={(id) => id}
        contentContainerStyle={styles.listPad}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />}
        ListHeaderComponent={
          <View>
            <Pressable onPress={() => setCityOpen(true)} style={styles.cityRow}>
              <Icon name="location" size={16} color={C.blue} />
              <Text style={styles.cityTxt}>
                {city.name} · {city.country}
              </Text>
              <Icon name="chevron-down" size={14} color={C.mute} />
              <View style={{ flex: 1 }} />
              <Text style={styles.trust}>{t('trust')}</Text>
            </Pressable>

            <Text style={styles.hello}>
              {t('welcome')}, {greetName}
            </Text>
            <Text style={styles.helloSub}>
              {t('welcomeSub')} · {countryLabel(detectedCountry, t)}
              {langManual ? '' : ` · ${t('autoLang')}`}
            </Text>

            <Pressable onPress={() => push('rewards')} style={styles.pointsBanner}>
              <View style={styles.pointsIcon}>
                <Icon name="diamond" size={18} color={C.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pointsLbl}>{t('luxPoints')}</Text>
                <Text style={styles.pointsVal}>{euro(luxPoints)}</Text>
              </View>
              <Text style={styles.pointsCta}>{t('useReward')}</Text>
              <Icon name="chevron-forward" size={16} color={C.blue} />
            </Pressable>

            <View style={styles.searchWrap}>
              <Icon name="search" size={18} color={C.mute} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder={t('search')}
                placeholderTextColor={C.mute}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
              />
              {q ? (
                <Pressable onPress={() => setQ('')}>
                  <Icon name="close-circle" size={18} color={C.mute} />
                </Pressable>
              ) : null}
            </View>
            {query ? (
              <Text style={styles.liveHint}>
                {t('searchLive')} · {services.length + workers.length}
              </Text>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              <Pressable onPress={() => setCat('all')} style={[styles.catChip, cat === 'all' && styles.catChipOn]}>
                <Text style={[styles.catChipTxt, cat === 'all' && styles.catChipTxtOn]}>{t('all')}</Text>
              </Pressable>
              {SERVICE_IDS.map((id) => (
                <Pressable key={id} onPress={() => setCat(id)} style={[styles.catChip, cat === id && styles.catChipOn]}>
                  <Icon name={SERVICE_ICONS[id]} size={14} color={cat === id ? C.white : C.blue} />
                  <Text style={[styles.catChipTxt, cat === id && styles.catChipTxtOn]}>
                    {t(id)} · €{PRICES[id]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{t('services')}</Text>
              <Text style={styles.sectionMeta}>{t('popular')}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => openService(item)} style={styles.serviceCard}>
            <View style={styles.serviceIcon}>
              <Icon name={SERVICE_ICONS[item]} size={22} color={C.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceName}>{t(item)}</Text>
              <Text style={styles.serviceDesc} numberOfLines={2}>
                {t(`${item}Desc`)}
              </Text>
            </View>
            <PriceTag amount={PRICES[item]} />
          </Pressable>
        )}
        ListEmptyComponent={<Empty icon="search" title={t('noResults')} sub={t('emptySearch')} />}
        ListFooterComponent={
          <View style={{ marginTop: 8 }}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{query ? t('nearbyShort') : t('nearby')}</Text>
              <Text style={styles.sectionMeta}>{t('featured')}</Text>
            </View>
            {workers.length === 0 ? (
              <Empty icon="people" title={t('noResults')} />
            ) : (
              workers.map((w) => <WorkerRow key={w.id} worker={w} onPress={() => openWorker(w.id)} />)
            )}
            <View style={{ height: 18 }} />
          </View>
        }
      />

      <Modal visible={cityOpen} transparent animationType="fade" onRequestClose={() => setCityOpen(false)}>
        <Pressable style={styles.modalBg} onPress={() => setCityOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('location')}</Text>
            {CITIES.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  setCity(c.id);
                  setCityOpen(false);
                }}
                style={[styles.sheetRow, cityId === c.id && styles.sheetRowOn]}
              >
                <Icon name="location-outline" size={16} color={C.blue} />
                <Text style={styles.sheetLbl}>
                  {c.name} · {c.country}
                </Text>
                {cityId === c.id ? <Icon name="checkmark" size={18} color={C.blue} /> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function WorkerRow({ worker, onPress }: { worker: Worker; onPress: () => void }) {
  const { t } = useApp();
  const city = cityById(worker.cityId);
  return (
    <Pressable onPress={onPress} style={styles.workerCard}>
      <Avatar initials={worker.initials} accent={worker.accent} />
      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.workerName}>{worker.name}</Text>
          <PriceTag amount={PRICES[worker.serviceId]} />
        </View>
        <Text style={styles.workerMeta}>
          {t(worker.serviceId)} · {city.name}
        </Text>
        <View style={styles.row}>
          <Stars n={worker.rating} />
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.workerMeta}>
            {worker.jobs} {t('jobsDone')}
          </Text>
          {worker.available ? (
            <View style={styles.avail}>
              <View style={styles.availDot} />
              <Text style={styles.availTxt}>{t('available')}</Text>
            </View>
          ) : (
            <Text style={[styles.workerMeta, { marginLeft: 8 }]}>{t('offline')}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function ServiceScreen() {
  const { t, serviceId, pop, openWorker, startBook } = useApp();
  const id = serviceId || 'cleaning';
  const pros = WORKERS.filter((w) => w.serviceId === id);
  return (
    <View style={styles.flex}>
      <BlueHeader title={t(id)} subtitle={`€${PRICES[id]}${t('perHour')}`} onBack={pop} />
      <FlatList
        data={pros}
        keyExtractor={(w) => w.id}
        contentContainerStyle={styles.listPad}
        ListHeaderComponent={
          <View>
            <View style={styles.infoCard}>
              <View style={styles.serviceIconLg}>
                <Icon name={SERVICE_ICONS[id]} size={28} color={C.white} />
              </View>
              <Text style={styles.infoLead}>{t(`${id}Desc`)}</Text>
              <View style={styles.rowWrap}>
                <Badge text={`€${PRICES[id]}${t('perHour')}`} />
                <Badge text={t('verified')} soft />
                <Badge text={t('gdpr')} soft />
              </View>
              <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t('whatsIncluded')}</Text>
              {[t('includeInsured'), t('includeUpdates'), t('includeAddress'), t('includeCashback')].map((x) => (
                <View key={x} style={styles.includeRow}>
                  <Icon name="checkmark-circle" size={16} color={C.blue} />
                  <Text style={styles.includeTxt}>{x}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 8 }]}>{t('nearby')}</Text>
          </View>
        }
        renderItem={({ item }) => <WorkerRow worker={item} onPress={() => openWorker(item.id)} />}
        ListFooterComponent={
          <View style={{ marginTop: 8, marginBottom: 24 }}>
            <PrimaryButton
              label={t('bookService')}
              icon="calendar"
              onPress={() => startBook(id, (pros.find((p) => p.available) || pros[0]).id)}
            />
          </View>
        }
      />
    </View>
  );
}

function WorkerScreen() {
  const { t, workerId, pop, startBook, ensureThread, push } = useApp();
  const w = workerById(workerId || 'w1')!;
  const city = cityById(w.cityId);
  return (
    <View style={styles.flex}>
      <BlueHeader title={t('proTitle')} onBack={pop} />
      <ScrollView contentContainerStyle={styles.listPad}>
        <View style={styles.proHero}>
          <Avatar initials={w.initials} size={72} accent={w.accent} />
          <Text style={styles.proName}>{w.name}</Text>
          <Text style={styles.proRole}>
            {t(w.serviceId)} · {city.name}
          </Text>
          <View style={[styles.row, { marginTop: 8, gap: 8 }]}>
            <Stars n={w.rating} />
            <Badge text={`${w.jobs} ${t('jobsDone')}`} soft />
            {w.available ? <Badge text={t('availableNow')} /> : <Badge text={t('offline')} soft />}
          </View>
          <View style={{ marginTop: 12 }}>
            <PriceTag amount={PRICES[w.serviceId]} />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>{t('aboutPro')}</Text>
          <Text style={styles.body}>{w.bio}</Text>
          <Text style={[styles.sectionTitle, { marginTop: 14 }]}>{t('languagesSpoken')}</Text>
          <View style={styles.rowWrap}>
            {w.langs.map((l) => (
              <Badge key={l} text={l} soft />
            ))}
          </View>
        </View>

        <View style={styles.lockCard}>
          <Icon name="shield-checkmark" size={22} color={C.blue} />
          <View style={{ flex: 1 }}>
            <Text style={styles.lockTitle}>{t('privacy')}</Text>
            <Text style={styles.lockTxt}>{t('noPhone')}</Text>
            <Text style={styles.lockTxt}>{t('noEmail')}</Text>
            <Text style={styles.lockTxt}>{t('contactInApp')}</Text>
            <Text style={styles.lockTxt}>{t('revealAfter')}</Text>
          </View>
          <Badge text={t('gdpr')} />
        </View>

        <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>{t('reviews')}</Text>
        {w.reviews.map((r, i) => (
          <View key={i} style={styles.reviewCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.reviewAuthor}>{r.author}</Text>
              <Stars n={r.stars} />
            </View>
            <Text style={styles.body}>{r.text}</Text>
          </View>
        ))}

        <View style={{ gap: 10, marginTop: 8, marginBottom: 28 }}>
          <PrimaryButton label={t('bookWorker')} icon="calendar" onPress={() => startBook(w.serviceId, w.id)} />
          <GhostButton
            label={t('openChat')}
            onPress={() => {
              const id = ensureThread(w.id);
              push('thread', { threadId: id, workerId: w.id });
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function BookScreen() {
  const { t, pop, bookingDraft, updateDraft, push, workerId, serviceId } = useApp();
  const sid = bookingDraft.serviceId || serviceId || 'cleaning';
  const wid = bookingDraft.workerId || workerId || 'w1';
  const w = workerById(wid)!;
  const days = useMemo(() => nextDays(14), []);
  const rate = PRICES[sid];
  const subtotal = rate * bookingDraft.hours;

  return (
    <View style={styles.flex}>
      <BlueHeader title={t('bookTitle')} subtitle={`${t(sid)} · €${rate}${t('perHour')}`} onBack={pop} />
      <ScrollView contentContainerStyle={styles.listPad} keyboardShouldPersistTaps="handled">
        <WorkerRow worker={w} onPress={() => {}} />

        <Text style={styles.fieldLbl}>{t('selectDate')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {days.map((d) => {
            const on = bookingDraft.date === d.key;
            return (
              <Pressable key={d.key} onPress={() => updateDraft({ date: d.key })} style={[styles.dayChip, on && styles.dayChipOn]}>
                <Text style={[styles.dayMon, on && { color: C.white }]}>{d.mon}</Text>
                <Text style={[styles.dayNum, on && { color: C.white }]}>{d.d}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.fieldLbl}>{t('selectTime')}</Text>
        <View style={styles.rowWrap}>
          {TIMES.map((tm) => {
            const on = bookingDraft.time === tm;
            return (
              <Pressable key={tm} onPress={() => updateDraft({ time: tm })} style={[styles.timeChip, on && styles.catChipOn]}>
                <Text style={[styles.catChipTxt, on && styles.catChipTxtOn]}>{tm}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLbl}>{t('duration')}</Text>
        <View style={styles.stepper}>
          <Pressable onPress={() => updateDraft({ hours: Math.max(1, bookingDraft.hours - 1) })} style={styles.stepBtn}>
            <Icon name="remove" size={18} color={C.blue} />
          </Pressable>
          <Text style={styles.stepVal}>
            {bookingDraft.hours} {bookingDraft.hours === 1 ? t('hour') : t('hours')}
          </Text>
          <Pressable onPress={() => updateDraft({ hours: Math.min(8, bookingDraft.hours + 1) })} style={styles.stepBtn}>
            <Icon name="add" size={18} color={C.blue} />
          </Pressable>
        </View>

        <Text style={styles.fieldLbl}>{t('address')}</Text>
        <TextInput
          value={bookingDraft.address}
          onChangeText={(address) => updateDraft({ address })}
          placeholder="12 Rue Aldringen, 1118 Luxembourg"
          placeholderTextColor={C.mute}
          style={styles.input}
        />
        <View style={styles.lockMini}>
          <Icon name="eye-off" size={14} color={C.blue} />
          <Text style={styles.lockMiniTxt}>{t('addressHidden')}</Text>
        </View>

        <Text style={styles.fieldLbl}>{t('notes')}</Text>
        <TextInput
          value={bookingDraft.notes}
          onChangeText={(notes) => updateDraft({ notes })}
          placeholder={t('notes')}
          placeholderTextColor={C.mute}
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          multiline
        />

        <View style={styles.sumCard}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLbl}>
              €{rate} × {bookingDraft.hours}
            </Text>
            <Text style={styles.sumVal}>{euro(subtotal)}</Text>
          </View>
          <Text style={styles.hint}>{t('addressHidden')}</Text>
        </View>

        <PrimaryButton
          label={t('continue')}
          icon="lock-closed"
          onPress={() => {
            if (!bookingDraft.date || !bookingDraft.time || !bookingDraft.address.trim()) {
              Alert.alert(t('appName'), t('fillBooking'));
              return;
            }
            push('pay');
          }}
        />
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function PayScreen() {
  const { t, pop, bookingDraft, updateDraft, luxPoints, completePayment, push } = useApp();
  const sid = bookingDraft.serviceId || 'cleaning';
  const rate = PRICES[sid];
  const subtotal = rate * bookingDraft.hours;
  const discount = bookingDraft.usePoints ? Math.min(luxPoints, subtotal) : 0;
  const total = Math.max(0, +(subtotal - discount).toFixed(2));
  const [method, setMethod] = useState<PayMethod>('card');
  const [card, setCard] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('Alex Moreau');
  const [busy, setBusy] = useState(false);

  const formatCard = (v: string) =>
    v
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, '$1 ');
  const formatExp = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const pay = () => {
    if (method === 'card') {
      const digits = card.replace(/\s/g, '');
      if (digits.length < 16) {
        Alert.alert(t('payment'), t('invalidCard'));
        return;
      }
      if (!exp || !cvc || !name.trim()) {
        Alert.alert(t('payment'), t('fillAll'));
        return;
      }
    }
    setBusy(true);
    setTimeout(() => {
      const b = completePayment(method);
      setBusy(false);
      if (b) push('done', { lastPaidId: b.id });
    }, 1400);
  };

  return (
    <View style={styles.flex}>
      <BlueHeader title={t('payTitle')} subtitle={t('secure')} onBack={pop} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.listPad} keyboardShouldPersistTaps="handled">
          <View style={styles.sumCard}>
            <Text style={styles.sectionTitle}>{t(sid)}</Text>
            <View style={styles.sumRow}>
              <Text style={styles.sumLbl}>
                {t('rate')} €{rate}
                {t('perHour')} × {bookingDraft.hours}
              </Text>
              <Text style={styles.sumVal}>{euro(subtotal)}</Text>
            </View>
            {discount > 0 ? (
              <View style={styles.sumRow}>
                <Text style={[styles.sumLbl, { color: C.blue }]}>{t('discount')}</Text>
                <Text style={[styles.sumVal, { color: C.blue }]}>-{euro(discount)}</Text>
              </View>
            ) : null}
            <View style={[styles.sumRow, styles.totalRow]}>
              <Text style={styles.totalLbl}>{t('total')}</Text>
              <Text style={styles.totalVal}>{euro(total)}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => updateDraft({ usePoints: !bookingDraft.usePoints })}
            style={[styles.pointsToggle, bookingDraft.usePoints && styles.pointsToggleOn]}
          >
            <Icon name={bookingDraft.usePoints ? 'checkbox' : 'square-outline'} size={20} color={C.blue} />
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>{t('applyPoints')}</Text>
              <Text style={styles.toggleSub}>
                {t('balance')} {euro(luxPoints)}
              </Text>
            </View>
            <Text style={styles.toggleAmt}>{euro(Math.min(luxPoints, subtotal))}</Text>
          </Pressable>

          <Text style={styles.fieldLbl}>{t('chooseMethod')}</Text>
          <View style={styles.payMethods}>
            {(
              [
                { id: 'card' as PayMethod, icon: 'card' as const, label: t('payCard'), hint: t('cardHint') },
                { id: 'apple' as PayMethod, icon: 'logo-apple' as const, label: t('applePay'), hint: t('applePayHint') },
                { id: 'google' as PayMethod, icon: 'logo-google' as const, label: t('googlePay'), hint: t('googlePayHint') },
              ] as const
            ).map((m) => (
              <Pressable key={m.id} onPress={() => setMethod(m.id)} style={[styles.payMethod, method === m.id && styles.payMethodOn]}>
                <Icon name={m.icon} size={18} color={method === m.id ? C.white : C.blue} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.payMethodTitle, method === m.id && { color: C.white }]}>{m.label}</Text>
                  <Text style={[styles.payMethodHint, method === m.id && { color: C.blueMid }]}>{m.hint}</Text>
                </View>
                <Icon name={method === m.id ? 'radio-button-on' : 'radio-button-off'} size={18} color={method === m.id ? C.white : C.blue} />
              </Pressable>
            ))}
          </View>

          {method === 'card' ? (
            <View>
              <Text style={styles.fieldLbl}>{t('cardholder')}</Text>
              <TextInput value={name} onChangeText={setName} style={styles.input} placeholder={t('cardholder')} placeholderTextColor={C.mute} />
              <Text style={styles.fieldLbl}>{t('cardNumber')}</Text>
              <TextInput
                value={card}
                onChangeText={(v) => setCard(formatCard(v))}
                style={styles.input}
                placeholder="4242 4242 4242 4242"
                placeholderTextColor={C.mute}
                keyboardType="number-pad"
                maxLength={19}
              />
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLbl}>{t('expiry')}</Text>
                  <TextInput
                    value={exp}
                    onChangeText={(v) => setExp(formatExp(v))}
                    style={styles.input}
                    placeholder="12/28"
                    placeholderTextColor={C.mute}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLbl}>{t('cvc')}</Text>
                  <TextInput
                    value={cvc}
                    onChangeText={(v) => setCvc(v.replace(/\D/g, '').slice(0, 4))}
                    style={styles.input}
                    placeholder="123"
                    placeholderTextColor={C.mute}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>
          ) : null}

          <View style={styles.stripeRow}>
            <Icon name="lock-closed" size={14} color={C.mute} />
            <Text style={styles.stripeTxt}>{t('stripe')}</Text>
          </View>

          <PrimaryButton
            label={busy ? t('processing') : `${t('payAmount')} ${euro(total)}`}
            icon={method === 'apple' ? 'logo-apple' : method === 'google' ? 'logo-google' : 'card'}
            onPress={pay}
            disabled={busy}
            dark={method === 'apple'}
          />
          {busy ? (
            <View style={styles.busyRow}>
              <ActivityIndicator color={C.blue} />
              <Text style={styles.busyTxt}>{t('processing')}</Text>
            </View>
          ) : null}
          <View style={{ height: 28 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function DoneScreen() {
  const { t, lastPaidId, bookings, goTab, ensureThread, push, workerId } = useApp();
  const b = bookings.find((x) => x.id === lastPaidId) || bookings[0];
  const w = workerById(b.workerId)!;
  return (
    <View style={styles.flex}>
      <BlueHeader title={t('doneTitle')} />
      <ScrollView contentContainerStyle={styles.listPad}>
        <View style={styles.successHero}>
          <View style={styles.successRing}>
            <Icon name="checkmark" size={36} color={C.white} />
          </View>
          <Text style={styles.successTitle}>{t('confirmed')}</Text>
          <Text style={styles.successSub}>{t('success')}</Text>
        </View>

        <View style={styles.infoCard}>
          <Row k={t('bookingId')} v={b.id} />
          <Row k={t('assigned')} v={w.name} />
          <Row k={t(b.serviceId)} v={`€${b.rate}${t('perHour')} · ${b.hours}h`} />
          <Row k={t('when')} v={`${b.date} · ${b.time}`} />
          <Row k={t('where')} v={b.address} />
          <Row k={t('paidWith')} v={b.payMethod === 'apple' ? 'Apple Pay' : b.payMethod === 'google' ? 'Google Pay' : t('card')} />
          <Row k={t('total')} v={euro(b.total)} />
          <Row k={t('customerReward')} v={`+${euro(b.customerReward)}`} />
        </View>

        <View style={styles.lockCard}>
          <Icon name="navigate" size={20} color={C.blue} />
          <View style={{ flex: 1 }}>
            <Text style={styles.lockTitle}>{t('sharedNow')}</Text>
            <Text style={styles.lockTxt}>{b.address}</Text>
          </View>
        </View>

        <View style={styles.rewardCard}>
          <Icon name="diamond" size={22} color={C.blue} />
          <View style={{ flex: 1 }}>
            <Text style={styles.lockTitle}>{t('rewardEarned')}</Text>
            <Text style={styles.lockTxt}>
              +{euro(b.customerReward)} {t('luxPoints')}
            </Text>
          </View>
        </View>

        <View style={{ gap: 10, marginTop: 8 }}>
          <PrimaryButton
            label={t('openChat')}
            icon="chatbubbles"
            onPress={() => {
              const id = ensureThread(b.workerId, b.id);
              push('thread', { threadId: id, workerId: b.workerId });
            }}
          />
          <GhostButton label={t('bookings')} onPress={() => goTab('bookings')} />
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.k}>{k}</Text>
      <Text style={styles.v}>{v}</Text>
    </View>
  );
}

function BookingsScreen() {
  const { t, bookings, role, pop, stack, openWorker, ensureThread, push, cancelBooking, acceptJob, rejectJob } = useApp();
  const [tab, setTab] = useState<'upcoming' | 'active' | 'completed'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const filtered = bookings.filter((b) => {
    if (tab === 'upcoming') return b.status === 'pending' || b.status === 'accepted';
    if (tab === 'active') return b.status === 'in_progress' || b.status === 'accepted';
    return b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected';
  });
  const showBack = stack.length > 1;

  return (
    <View style={styles.flex}>
      <BlueHeader title={t('bookings')} onBack={showBack ? pop : undefined} />
      <View style={styles.seg}>
        {(['upcoming', 'active', 'completed'] as const).map((x) => (
          <Pressable key={x} onPress={() => setTab(x)} style={[styles.segItem, tab === x && styles.segOn]}>
            <Text style={[styles.segTxt, tab === x && styles.segTxtOn]}>{t(x)}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.listPad}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); }} tintColor={C.blue} />
        }
        ListEmptyComponent={<Empty icon="calendar-outline" title={t('noBookings')} sub={t('emptyBookings')} />}
        renderItem={({ item }) => {
          const w = workerById(item.workerId)!;
          return (
            <View style={styles.bookCard}>
              <View style={styles.rowBetween}>
                <Badge text={t(item.serviceId)} />
                <PriceTag amount={item.rate} />
              </View>
              <Text style={styles.bookId}>{item.id}</Text>
              <Text style={styles.workerName}>{w.name}</Text>
              <Text style={styles.workerMeta}>
                {item.date} · {item.time} · {item.hours}h · {euro(item.total)}
              </Text>
              <View style={styles.addrBox}>
                <Icon name={item.paid ? 'location' : 'eye-off'} size={14} color={C.blue} />
                <Text style={styles.addrTxt}>{item.paid ? item.address : maskAddress(item.address)}</Text>
              </View>
              {!item.paid ? <Text style={styles.hint}>{t('hiddenUntil')}</Text> : <Text style={styles.hint}>{t('addressRevealed')}</Text>}
              <View style={styles.rowWrap}>
                <Badge
                  text={
                    item.status === 'pending'
                      ? t('pending')
                      : item.status === 'accepted'
                      ? t('upcoming')
                      : item.status === 'completed'
                      ? t('completed')
                      : item.status === 'rejected'
                      ? t('rejected')
                      : t('cancelled')
                  }
                  soft={item.status !== 'accepted'}
                />
                {item.paid ? <Badge text={t('paid')} soft /> : null}
              </View>
              <View style={styles.bookActions}>
                <Pressable
                  style={styles.smallBtn}
                  onPress={() => {
                    const id = ensureThread(item.workerId, item.id);
                    push('thread', { threadId: id, workerId: item.workerId });
                  }}
                >
                  <Icon name="chatbubble-ellipses" size={14} color={C.blue} />
                  <Text style={styles.smallBtnTxt}>{t('openChat')}</Text>
                </Pressable>
                <Pressable style={styles.smallBtn} onPress={() => openWorker(item.workerId)}>
                  <Icon name="person" size={14} color={C.blue} />
                  <Text style={styles.smallBtnTxt}>{t('proTitle')}</Text>
                </Pressable>
                {role === 'customer' && (item.status === 'pending' || item.status === 'accepted') ? (
                  <Pressable style={styles.smallBtn} onPress={() => cancelBooking(item.id)}>
                    <Icon name="close" size={14} color={C.danger} />
                    <Text style={[styles.smallBtnTxt, { color: C.danger }]}>{t('cancel')}</Text>
                  </Pressable>
                ) : null}
                {role === 'worker' && item.status === 'pending' ? (
                  <>
                    <Pressable style={[styles.smallBtn, styles.smallBtnSolid]} onPress={() => acceptJob(item.id)}>
                      <Text style={[styles.smallBtnTxt, { color: C.white }]}>{t('accept')}</Text>
                    </Pressable>
                    <Pressable style={styles.smallBtn} onPress={() => rejectJob(item.id)}>
                      <Text style={[styles.smallBtnTxt, { color: C.danger }]}>{t('reject')}</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

function ChatListScreen() {
  const { t, convos, openThread } = useApp();
  return (
    <View style={styles.flex}>
      <BlueHeader title={t('messages')} subtitle={t('chatSecure')} />
      <FlatList
        data={convos}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.listPad}
        ListEmptyComponent={<Empty icon="chatbubbles-outline" title={t('noMessages')} sub={t('startChat')} />}
        renderItem={({ item }) => {
          const w = workerById(item.workerId)!;
          return (
            <Pressable onPress={() => openThread(item.id)} style={styles.chatRow}>
              <Avatar initials={w.initials} />
              <View style={{ flex: 1 }}>
                <Text style={styles.workerName}>{w.name}</Text>
                <Text style={styles.workerMeta} numberOfLines={1}>
                  {item.last || t('chatSecure')}
                </Text>
              </View>
              <Icon name="chevron-forward" size={16} color={C.mute} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function ThreadScreen() {
  const { t, pop, convos, threadId, sendMessage, bookings } = useApp();
  const [text, setText] = useState('');
  const convo = convos.find((c) => c.id === threadId) || convos[0];
  const w = workerById(convo?.workerId || 'w1')!;
  const related = bookings.find((b) => b.id === convo?.bookingId || b.workerId === w.id);
  const listRef = useRef<FlatList>(null);

  if (!convo) {
    return (
      <View style={styles.flex}>
        <BlueHeader title={t('chatTitle')} onBack={pop} />
        <Empty icon="chatbubbles-outline" title={t('noMessages')} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <BlueHeader title={w.name} subtitle={t('inAppOnly')} onBack={pop} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <FlatList
          ref={listRef}
          data={convo.messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.msgPad}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <View>
              <View style={styles.lockMini}>
                <Icon name="shield-checkmark" size={14} color={C.blue} />
                <Text style={styles.lockMiniTxt}>
                  {t('hideContact')} · {t('noPhone')} · {t('noEmail')}
                </Text>
              </View>
              {related ? (
                <View style={styles.addrBox}>
                  <Icon name={related.paid ? 'location' : 'eye-off'} size={14} color={C.blue} />
                  <Text style={styles.addrTxt}>
                    {related.paid ? related.address : `${t('hiddenUntil')} · ${maskAddress(related.address)}`}
                  </Text>
                </View>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.from === 'me' ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleTxt, item.from === 'me' && { color: C.white }]}>{item.text}</Text>
            </View>
          )}
        />
        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('chatPh')}
            placeholderTextColor={C.mute}
            style={styles.composerInput}
            returnKeyType="send"
            onSubmitEditing={() => {
              sendMessage(convo.id, text);
              setText('');
            }}
          />
          <Pressable
            onPress={() => {
              sendMessage(convo.id, text);
              setText('');
            }}
            style={styles.sendBtn}
          >
            <Icon name="send" size={16} color={C.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function RewardsScreen() {
  const { t, luxPoints, pointsLog } = useApp();
  const earned = pointsLog.filter((p) => p.amount > 0).reduce((a, p) => a + p.amount, 0);
  const spent = pointsLog.filter((p) => p.amount < 0).reduce((a, p) => a + Math.abs(p.amount), 0);
  return (
    <View style={styles.flex}>
      <BlueHeader title={t('rewardsTitle')} subtitle={t('pointsBal')} />
      <FlatList
        data={pointsLog}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.listPad}
        ListHeaderComponent={
          <View>
            <View style={styles.balanceHero}>
              <Text style={styles.balanceLbl}>{t('luxPoints')}</Text>
              <Text style={styles.balanceVal}>{euro(luxPoints)}</Text>
              <View style={styles.row}>
                <View style={styles.miniStat}>
                  <Text style={styles.miniK}>{t('cashback')}</Text>
                  <Text style={styles.miniV}>{euro(earned)}</Text>
                </View>
                <View style={styles.miniStat}>
                  <Text style={styles.miniK}>{t('discount')}</Text>
                  <Text style={styles.miniV}>{euro(spent)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>{t('useReward')}</Text>
              <Text style={styles.body}>{t('rewardsHint')}</Text>
              <Text style={styles.body}>{t('applyPoints')}</Text>
            </View>
            <Text style={[styles.sectionTitle, { marginVertical: 10 }]}>{t('history')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.logRow}>
            <View style={[styles.logDot, { backgroundColor: item.amount >= 0 ? C.blue : C.mist }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.logLbl}>{item.label}</Text>
              <Text style={styles.workerMeta}>{new Date(item.ts).toLocaleString()}</Text>
            </View>
            <Text style={[styles.logAmt, { color: item.amount >= 0 ? C.blue : C.ink }]}>
              {item.amount >= 0 ? '+' : ''}
              {euro(item.amount)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

function JobsScreen() {
  const { t, bookings, acceptJob, rejectJob, ensureThread, push } = useApp();
  const incoming = bookings.filter((b) => b.status === 'pending' && b.paid);
  const active = bookings.filter((b) => b.status === 'accepted' || b.status === 'in_progress');
  type JobRow = { type: 'h'; id: string; title: string; b?: undefined } | { type: 'b'; id: string; title?: undefined; b: Booking };
  const data: JobRow[] = [
    { type: 'h', id: 'h1', title: t('incoming') },
    ...incoming.map((b): JobRow => ({ type: 'b', id: b.id, b })),
    { type: 'h', id: 'h2', title: t('active') },
    ...active.map((b): JobRow => ({ type: 'b', id: b.id, b })),
  ];

  return (
    <View style={styles.flex}>
      <BlueHeader title={t('jobsTitle')} subtitle={t('workerDash')} />
      <FlatList
        data={data}
        keyExtractor={(x) => x.id}
        contentContainerStyle={styles.listPad}
        ListEmptyComponent={<Empty icon="briefcase-outline" title={t('none')} />}
        renderItem={({ item }) => {
          if (item.type === 'h') {
            return <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 8 }]}>{item.title}</Text>;
          }
          const b = (item as { b: Booking }).b;
          const w = workerById(b.workerId)!;
          return (
            <View style={styles.bookCard}>
              <View style={styles.rowBetween}>
                <Badge text={t('newRequest')} />
                <PriceTag amount={b.rate} />
              </View>
              <Text style={styles.workerName}>
                {t(b.serviceId)} · {b.customerName}
              </Text>
              <Text style={styles.workerMeta}>
                {b.date} · {b.time} · {b.hours}h
              </Text>
              <View style={styles.addrBox}>
                <Icon name={b.paid ? 'location' : 'eye-off'} size={14} color={C.blue} />
                <Text style={styles.addrTxt}>{b.paid ? b.address : t('unlocks')}</Text>
              </View>
              <View style={styles.sumRow}>
                <Text style={styles.sumLbl}>{t('yourPay')}</Text>
                <Text style={styles.sumVal}>
                  €{b.rate} × {b.hours}h
                </Text>
              </View>
              {b.status === 'pending' ? (
                <View style={styles.bookActions}>
                  <Pressable style={[styles.smallBtn, styles.smallBtnSolid]} onPress={() => acceptJob(b.id)}>
                    <Text style={[styles.smallBtnTxt, { color: C.white }]}>{t('acceptJob')}</Text>
                  </Pressable>
                  <Pressable style={styles.smallBtn} onPress={() => rejectJob(b.id)}>
                    <Text style={[styles.smallBtnTxt, { color: C.danger }]}>{t('rejectJob')}</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={styles.smallBtn}
                  onPress={() => {
                    const id = ensureThread(w.id, b.id);
                    push('thread', { threadId: id, workerId: w.id });
                  }}
                >
                  <Icon name="chatbubble-ellipses" size={14} color={C.blue} />
                  <Text style={styles.smallBtnTxt}>{t('msgCustomer')}</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

function EarningsScreen() {
  const { t, bookings } = useApp();
  const mine = bookings.filter((b) => b.paid && b.status !== 'rejected' && b.status !== 'cancelled');
  const income = mine.reduce((a, b) => a + b.subtotal, 0);
  const hours = mine.reduce((a, b) => a + b.hours, 0);
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const bars = [42, 68, 35, 80, 55, 90, 48];
  return (
    <View style={styles.flex}>
      <BlueHeader title={t('earnTitle')} subtitle={t('trackIncome')} />
      <FlatList
        data={mine}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.listPad}
        ListHeaderComponent={
          <View>
            <View style={styles.kpiRow}>
              <View style={styles.kpi}>
                <Text style={styles.kpiL}>{t('income')}</Text>
                <Text style={styles.kpiV}>{euro(income)}</Text>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiL}>{t('hoursLabel')}</Text>
                <Text style={styles.kpiV}>{hours}h</Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>{t('week')}</Text>
              <View style={styles.barRow}>
                {bars.map((h, i) => (
                  <View key={i} style={styles.barCol}>
                    <View style={[styles.bar, { height: h }]} />
                    <Text style={styles.barLbl}>{weekDays[i]}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={[styles.sectionTitle, { marginVertical: 10 }]}>{t('history')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.logRow}>
            <View style={styles.serviceIconSm}>
              <Icon name={SERVICE_ICONS[item.serviceId]} size={16} color={C.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logLbl}>
                {t(item.serviceId)} · €{item.rate}
                {t('perHour')}
              </Text>
              <Text style={styles.workerMeta}>
                {item.id} · {item.hours}h
              </Text>
            </View>
            <Text style={styles.logAmt}>{euro(item.subtotal)}</Text>
          </View>
        )}
        ListEmptyComponent={<Empty icon="trending-up" title={t('none')} />}
      />
    </View>
  );
}

function AdminHomeScreen() {
  const { t, bookings } = useApp();
  const paid = bookings.filter((b) => b.paid);
  const gmv = paid.reduce((a, b) => a + b.subtotal, 0);
  const comm = paid.reduce((a, b) => a + b.commission, 0);
  const rew = paid.reduce((a, b) => a + b.customerReward, 0);
  const inc = paid.reduce((a, b) => a + b.workerIncentive, 0);
  const byMarket: Record<string, number> = { luxembourg: 0, germany: 0, france: 0 };
  paid.forEach((b) => {
    const m = cityById(b.cityId).market;
    byMarket[m] = (byMarket[m] || 0) + b.subtotal;
  });

  return (
    <View style={styles.flex}>
      <BlueHeader title={t('adminTitle')} subtitle={t('live')} />
      <ScrollView contentContainerStyle={styles.listPad}>
        <View style={styles.kpiRow}>
          <View style={styles.kpi}>
            <Text style={styles.kpiL}>{t('gmv')}</Text>
            <Text style={styles.kpiV}>{euro(gmv)}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiL}>{t('commission')}</Text>
            <Text style={styles.kpiV}>{euro(comm)}</Text>
          </View>
        </View>
        <View style={styles.kpiRow}>
          <View style={styles.kpi}>
            <Text style={styles.kpiL}>{t('rewardsPaid')}</Text>
            <Text style={styles.kpiV}>{euro(rew)}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiL}>{t('incentivesPaid')}</Text>
            <Text style={styles.kpiV}>{euro(inc)}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>{t('markets')}</Text>
          {(['luxembourg', 'germany', 'france'] as const).map((m) => {
            const max = Math.max(1, ...Object.values(byMarket));
            return (
              <View key={m} style={{ marginBottom: 10 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.body}>{t(m)}</Text>
                  <Text style={styles.sumVal}>{euro(byMarket[m] || 0)}</Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.trackFill, { width: `${((byMarket[m] || 0) / max) * 100}%` }]} />
                </View>
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginVertical: 10 }]}>{t('adminBookings')}</Text>
        {bookings.map((b) => (
          <View key={b.id} style={styles.logRow}>
            <View style={styles.serviceIconSm}>
              <Icon name={SERVICE_ICONS[b.serviceId]} size={16} color={C.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logLbl}>
                {b.id} · {t(b.serviceId)} · €{b.rate}
                {t('perHour')}
              </Text>
              <Text style={styles.workerMeta}>
                {t('platformKeep')} {euro(b.commission)} · {cityById(b.cityId).name}
              </Text>
            </View>
            <Text style={styles.logAmt}>{euro(b.total)}</Text>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function AdminFinanceScreen() {
  const { t, bookings } = useApp();
  const paid = bookings.filter((b) => b.paid);
  return (
    <View style={styles.flex}>
      <BlueHeader title={t('finTitle')} subtitle={t('ledger')} />
      <FlatList
        data={paid}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.listPad}
        ListHeaderComponent={
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>{t('howTitle')}</Text>
            <Text style={styles.body}>{t('how1')}</Text>
            <Text style={styles.body}>{t('how3')}</Text>
            <Text style={styles.body}>{t('how4')}</Text>
            <Text style={styles.body}>{t('how5')}</Text>
            <View style={styles.flowGrid}>
              <View style={styles.flowCell}>
                <Text style={styles.flowN}>{euro(paid.reduce((a, b) => a + b.commission, 0))}</Text>
                <Text style={styles.flowL}>{t('commission')}</Text>
              </View>
              <View style={styles.flowCell}>
                <Text style={styles.flowN}>{euro(paid.reduce((a, b) => a + b.customerReward, 0))}</Text>
                <Text style={styles.flowL}>{t('customerReward')}</Text>
              </View>
              <View style={styles.flowCell}>
                <Text style={styles.flowN}>{euro(paid.reduce((a, b) => a + b.workerIncentive, 0))}</Text>
                <Text style={styles.flowL}>{t('workerIncentive')}</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.bookCard}>
            <Text style={styles.bookId}>{item.id}</Text>
            <Row k={t('subtotal')} v={euro(item.subtotal)} />
            <Row k={t('discount')} v={euro(item.pointsUsed)} />
            <Row k={t('customerReward')} v={euro(item.customerReward)} />
            <Row k={t('workerIncentive')} v={euro(item.workerIncentive)} />
            <Row k={t('platformKeep')} v={euro(item.commission)} />
            <Row k={t('workerNet')} v={euro(item.subtotal - item.commission + item.workerIncentive)} />
          </View>
        )}
      />
    </View>
  );
}

function AdminUsersScreen() {
  const { t, bookings } = useApp();
  return (
    <View style={styles.flex}>
      <BlueHeader title={t('peopleTitle')} subtitle={t('adminUsers')} />
      <FlatList
        data={WORKERS}
        keyExtractor={(w) => w.id}
        contentContainerStyle={styles.listPad}
        ListHeaderComponent={
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>{t('demoUser')}</Text>
            <Text style={styles.body}>{t('protected')}</Text>
            <View style={styles.lockMini}>
              <Icon name="call" size={14} color={C.blue} />
              <Text style={styles.lockMiniTxt}>+352 ••• ••• 184 · {t('noPhone')}</Text>
            </View>
            <View style={styles.lockMini}>
              <Icon name="mail" size={14} color={C.blue} />
              <Text style={styles.lockMiniTxt}>a••••@luxmail.lu · {t('noEmail')}</Text>
            </View>
            <Text style={styles.hint}>
              {bookings.length} {t('bookings')}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const city = cityById(item.cityId);
          return (
            <View style={styles.workerCard}>
              <Avatar initials={item.initials} />
              <View style={{ flex: 1 }}>
                <Text style={styles.workerName}>{item.name}</Text>
                <Text style={styles.workerMeta}>
                  {t(item.serviceId)} · €{PRICES[item.serviceId]}
                  {t('perHour')} · {city.name}
                </Text>
                <View style={styles.lockMini}>
                  <Icon name="shield-checkmark" size={12} color={C.blue} />
                  <Text style={styles.lockMiniTxt}>{t('hideContact')}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

function ProfileScreen() {
  const { t, lang, setLang, role, setRole, cityId, setCity, resetDemo, luxPoints, session, detectedCountry, langManual, setAuthGate } = useApp();
  const [langOpen, setLangOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [about, setAbout] = useState(false);

  return (
    <View style={styles.flex}>
      <BlueHeader title={t('profileTitle')} />
      <ScrollView contentContainerStyle={styles.listPad}>
        <View style={styles.proHero}>
          <Avatar initials={(session?.name || t('demoUser')).split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()} size={72} />
          <Text style={styles.proName}>{session?.name || t('demoUser')}</Text>
          <Text style={styles.proRole}>
            {cityById(cityId).name} · {countryLabel(detectedCountry, t)}
            {langManual ? '' : ` · ${t('autoLang')}`}
          </Text>
          <View style={[styles.rowWrap, { marginTop: 10, justifyContent: 'center' }]}>
            <Badge text={t('gdpr')} />
            <Badge text={`${t('luxPoints')} ${euro(luxPoints)}`} soft />
          </View>
        </View>

        <View style={styles.lockCard}>
          <Icon name="shield-checkmark" size={22} color={C.blue} />
          <View style={{ flex: 1 }}>
            <Text style={styles.lockTitle}>{t('privacy')}</Text>
            <Text style={styles.lockTxt}>+352 ••• ••• 184</Text>
            <Text style={styles.lockTxt}>a••••@luxmail.lu</Text>
            <Text style={styles.lockTxt}>{t('inAppOnly')}</Text>
          </View>
        </View>

        <Text style={styles.fieldLbl}>{t('settings')}</Text>
        <Pressable style={styles.setting} onPress={() => setLangOpen(true)}>
          <Icon name="language" size={18} color={C.blue} />
          <Text style={styles.settingLbl}>{t('language')}</Text>
          <Text style={styles.settingVal}>{LANGS.find((l) => l.id === lang)?.label}</Text>
          <Icon name="chevron-forward" size={16} color={C.mute} />
        </Pressable>
        <Pressable style={styles.setting} onPress={() => setRoleOpen(true)}>
          <Icon name="swap-horizontal" size={18} color={C.blue} />
          <Text style={styles.settingLbl}>{t('switchRole')}</Text>
          <Text style={styles.settingVal}>{t(role)}</Text>
          <Icon name="chevron-forward" size={16} color={C.mute} />
        </Pressable>
        <Pressable style={styles.setting} onPress={() => setCityOpen(true)}>
          <Icon name="location" size={18} color={C.blue} />
          <Text style={styles.settingLbl}>{t('location')}</Text>
          <Text style={styles.settingVal}>{cityById(cityId).country}</Text>
          <Icon name="chevron-forward" size={16} color={C.mute} />
        </Pressable>
        <View style={styles.setting}>
          <Icon name="notifications" size={18} color={C.blue} />
          <Text style={styles.settingLbl}>{t('notifications')}</Text>
          <Text style={styles.settingVal}>{t('notificationsOn')}</Text>
        </View>
        <Pressable style={styles.setting} onPress={() => setHelp(true)}>
          <Icon name="help-circle" size={18} color={C.blue} />
          <Text style={styles.settingLbl}>{t('help')}</Text>
          <Icon name="chevron-forward" size={16} color={C.mute} />
        </Pressable>
        <Pressable style={styles.setting} onPress={() => setAbout(true)}>
          <Icon name="information-circle" size={18} color={C.blue} />
          <Text style={styles.settingLbl}>{t('about')}</Text>
          <Icon name="chevron-forward" size={16} color={C.mute} />
        </Pressable>

        <Text style={[styles.hint, { marginVertical: 12 }]}>{t('roleHint')}</Text>
        <GhostButton label={t('logout')} onPress={resetDemo} danger />
        <View style={{ height: 28 }} />
      </ScrollView>

      <Modal visible={langOpen} transparent animationType="fade" onRequestClose={() => setLangOpen(false)}>
        <Pressable style={styles.modalBg} onPress={() => setLangOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('language')}</Text>
            {LANGS.map((l) => (
              <Pressable
                key={l.id}
                onPress={() => {
                  setLang(l.id);
                  setLangOpen(false);
                }}
                style={[styles.sheetRow, lang === l.id && styles.sheetRowOn]}
              >
                <Text style={styles.sheetFlag}>{l.flag}</Text>
                <Text style={styles.sheetLbl}>{l.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
      <Modal visible={roleOpen} transparent animationType="fade" onRequestClose={() => setRoleOpen(false)}>
        <Pressable style={styles.modalBg} onPress={() => setRoleOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('switchRole')}</Text>
            {(['customer', 'worker', 'admin'] as Role[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => {
                  setRoleOpen(false);
                  if (r === 'admin' && role !== 'admin') {
                    setAuthGate('adminPin');
                    return;
                  }
                  setRole(r);
                }}
                style={[styles.sheetRow, role === r && styles.sheetRowOn]}
              >
                <Icon name={r === 'customer' ? 'home' : r === 'worker' ? 'briefcase' : 'grid'} size={16} color={C.blue} />
                <Text style={styles.sheetLbl}>{t(r)}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
      <Modal visible={cityOpen} transparent animationType="fade" onRequestClose={() => setCityOpen(false)}>
        <Pressable style={styles.modalBg} onPress={() => setCityOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('location')}</Text>
            {CITIES.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  setCity(c.id);
                  setCityOpen(false);
                }}
                style={[styles.sheetRow, cityId === c.id && styles.sheetRowOn]}
              >
                <Text style={styles.sheetLbl}>
                  {c.name} · {c.country}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
      <Modal visible={help} transparent animationType="fade" onRequestClose={() => setHelp(false)}>
        <Pressable style={styles.modalBg} onPress={() => setHelp(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('help')}</Text>
            <Text style={styles.body}>{t('helpBody')}</Text>
          </View>
        </Pressable>
      </Modal>
      <Modal visible={about} transparent animationType="fade" onRequestClose={() => setAbout(false)}>
        <Pressable style={styles.modalBg} onPress={() => setAbout(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t('about')}</Text>
            <Text style={styles.body}>{t('aboutBody')}</Text>
            <Text style={[styles.body, { marginTop: 8 }]}>{t('marketHint')}</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function LangSwitcher({ light }: { light?: boolean }) {
  const { lang, setLang } = useApp();
  const [open, setOpen] = useState(false);
  const meta = LANGS.find((l) => l.id === lang)!;
  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={light ? styles.langChip : styles.langChipDark}>
        <Text style={light ? styles.langChipTxt : styles.langChipDarkTxt}>
          {meta.flag} {meta.id.toUpperCase()}
        </Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBg} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{I18N[lang].language}</Text>
            {LANGS.map((l) => (
              <Pressable
                key={l.id}
                onPress={() => {
                  setLang(l.id);
                  setOpen(false);
                }}
                style={[styles.sheetRow, lang === l.id && styles.sheetRowOn]}
              >
                <Text style={styles.sheetFlag}>{l.flag}</Text>
                <Text style={styles.sheetLbl}>{l.label}</Text>
                {lang === l.id ? <Icon name="checkmark" size={18} color={C.blue} /> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function GateHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.headerBtn} hitSlop={10}>
            <Icon name="chevron-back" size={22} color={C.white} />
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={[styles.headerBtn, { width: 64, alignItems: 'flex-end' }]}>
          <LangSwitcher light />
        </View>
      </View>
    </View>
  );
}

function SplashScreen() {
  const { t, lang, detecting, detectedCountry, setAuthGate, langManual, session } = useApp();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();
  }, [fade, rise]);

  const country = countryLabel(detectedCountry, t);
  const welcome = t('splashWelcome');

  return (
    <View style={styles.flex}>
      <GateHeader title={t('appName')} subtitle={t('marketsLive')} />
      <ScrollView contentContainerStyle={styles.gatePad} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
          <View style={styles.splashHero}>
            <View style={styles.logoMark}>
              <Icon name="home" size={30} color={C.white} />
            </View>
            <Text style={styles.splashWelcome}>{welcome}</Text>
            <Text style={styles.splashHello}>{t('splashHello')}</Text>
            <Text style={styles.splashSub}>{t('splashSub')}</Text>
          </View>

          <View style={styles.detectCard}>
            {detecting ? (
              <>
                <ActivityIndicator color={C.blue} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detectTitle}>{t('splashDetect')}</Text>
                  <Text style={styles.detectSub}>{t('detecting')}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.detectDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detectTitle}>{t('splashDetected').replace('{country}', country)}</Text>
                  <Text style={styles.detectSub}>
                    {langManual ? t('localeManual') : t('localeAuto')} · {t('changeAnytime')}
                  </Text>
                </View>
                <Badge text={`${detectedCountry} · ${lang.toUpperCase()}`} />
              </>
            )}
          </View>

          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>{t('splashCats')}</Text>
          <View style={styles.splashGrid}>
            {SERVICE_IDS.map((id) => (
              <View key={id} style={styles.splashCat}>
                <View style={styles.serviceIcon}>
                  <Icon name={SERVICE_ICONS[id]} size={18} color={C.blue} />
                </View>
                <Text style={styles.splashCatName}>{t(id)}</Text>
                <Text style={styles.splashCatPrice}>
                  €{PRICES[id]}
                  {t('perHour')}
                </Text>
              </View>
            ))}
          </View>

          <PrimaryButton
            label={t('splashContinue')}
            icon="arrow-forward"
            onPress={() => setAuthGate(session ? 'app' : 'login')}
          />
          <Text style={[styles.hint, { textAlign: 'center', marginTop: 12 }]}>{t('changeAnytime')}</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function LoginScreen() {
  const { t, setAuthGate, signIn, detectedCountry } = useApp();
  const [email, setEmail] = useState('alex.moreau@luxmail.lu');
  const [password, setPassword] = useState('luxdemo');
  const [asWorker, setAsWorker] = useState(false);

  const submit = () => {
    if (!email.includes('@') || password.length < 6) {
      Alert.alert(t('loginTitle'), t('invalidAuth'));
      return;
    }
    signIn(email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()), email, asWorker ? 'worker' : 'customer');
  };

  return (
    <View style={styles.flex}>
      <GateHeader title={t('loginTitle')} subtitle={t('loginSub')} onBack={() => setAuthGate('splash')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.gatePad} keyboardShouldPersistTaps="handled">
          <View style={styles.detectCard}>
            <Icon name="globe" size={16} color={C.blue} />
            <Text style={styles.detectSub}>
              {t('detectedCountry')}: {countryLabel(detectedCountry, t)} · {t('changeAnytime')}
            </Text>
          </View>

          <Text style={styles.fieldLbl}>{t('email')}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('emailPh')}
            placeholderTextColor={C.mute}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.fieldLbl}>{t('password')}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('passwordPh')}
            placeholderTextColor={C.mute}
            style={styles.input}
            secureTextEntry
          />

          <Pressable onPress={() => setAsWorker((v) => !v)} style={styles.pointsToggle}>
            <Icon name={asWorker ? 'checkbox' : 'square-outline'} size={20} color={C.blue} />
            <Text style={styles.toggleTitle}>{asWorker ? t('workerLogin') : t('customerLogin')}</Text>
          </Pressable>

          <View style={{ height: 14 }} />
          <PrimaryButton label={t('loginCta')} icon="log-in" onPress={submit} />
          <View style={{ height: 10 }} />
          <GhostButton
            label={t('demoLogin')}
            onPress={() => signIn('Alex Moreau', 'alex.moreau@luxmail.lu', asWorker ? 'worker' : 'customer')}
          />

          <Pressable onPress={() => setAuthGate('signup')} style={styles.linkRow}>
            <Text style={styles.linkMuted}>{t('noAccount')}</Text>
            <Text style={styles.linkBlue}>{t('signupCta')}</Text>
          </Pressable>

          <Pressable onPress={() => setAuthGate('adminPin')} style={styles.staffRow}>
            <Icon name="lock-closed" size={14} color={C.blue} />
            <Text style={styles.staffTxt}>
              {t('staffAccess')} · {t('secretAdmin')}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SignupScreen() {
  const { t, setAuthGate, signIn } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => {
    if (!name.trim() || !email.includes('@') || password.length < 6) {
      Alert.alert(t('signupTitle'), t('invalidAuth'));
      return;
    }
    signIn(name.trim(), email.trim(), 'customer');
  };

  return (
    <View style={styles.flex}>
      <GateHeader title={t('signupTitle')} subtitle={t('signupSub')} onBack={() => setAuthGate('login')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.gatePad} keyboardShouldPersistTaps="handled">
          <View style={styles.lockCard}>
            <Icon name="shield-checkmark" size={20} color={C.blue} />
            <View style={{ flex: 1 }}>
              <Text style={styles.lockTitle}>{t('gdpr')}</Text>
              <Text style={styles.lockTxt}>{t('hideContact')}</Text>
              <Text style={styles.lockTxt}>{t('inAppOnly')}</Text>
            </View>
          </View>
          <Text style={styles.fieldLbl}>{t('fullName')}</Text>
          <TextInput value={name} onChangeText={setName} placeholder={t('namePh')} placeholderTextColor={C.mute} style={styles.input} />
          <Text style={styles.fieldLbl}>{t('email')}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('emailPh')}
            placeholderTextColor={C.mute}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.fieldLbl}>{t('password')}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('passwordPh')}
            placeholderTextColor={C.mute}
            style={styles.input}
            secureTextEntry
          />
          <View style={{ height: 16 }} />
          <PrimaryButton label={t('signupCta')} icon="person-add" onPress={submit} />
          <Pressable onPress={() => setAuthGate('login')} style={styles.linkRow}>
            <Text style={styles.linkMuted}>{t('hasAccount')}</Text>
            <Text style={styles.linkBlue}>{t('loginCta')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function AdminPinScreen() {
  const { t, setAuthGate, unlockAdmin, showToast, session } = useApp();
  const [pin, setPin] = useState('');
  const [shake] = useState(() => new Animated.Value(0));

  const press = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next === ADMIN_PIN) {
        setTimeout(() => unlockAdmin(), 180);
      } else {
        Animated.sequence([
          Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shake, { toValue: 6, duration: 50, useNativeDriver: true }),
          Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
        showToast(t('pinWrong'));
        setTimeout(() => setPin(''), 280);
      }
    }
  };

  return (
    <View style={styles.flex}>
      <GateHeader title={t('adminPinTitle')} subtitle={t('adminPinSub')} onBack={() => setAuthGate(session ? 'app' : 'login')} />
      <View style={styles.pinWrap}>
        <View style={styles.lockCard}>
          <Icon name="key" size={20} color={C.blue} />
          <View style={{ flex: 1 }}>
            <Text style={styles.lockTitle}>{t('secretAdmin')}</Text>
            <Text style={styles.lockTxt}>{t('enterPin')}</Text>
          </View>
        </View>
        <Animated.View style={[styles.pinDots, { transform: [{ translateX: shake }] }]}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.pinDot, pin.length > i && styles.pinDotOn]} />
          ))}
        </Animated.View>
        <View style={styles.pad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
            <Pressable
              key={k}
              onPress={() => {
                if (k === 'C') setPin('');
                else if (k === '⌫') setPin((p) => p.slice(0, -1));
                else press(k);
              }}
              style={({ pressed }) => [styles.padKey, pressed && { backgroundColor: C.blueSoft }]}
            >
              <Text style={styles.padTxt}>{k === 'C' ? t('pinClear') : k}</Text>
            </Pressable>
          ))}
        </View>
        <GhostButton label={session ? t('back') : t('backToLogin')} onPress={() => setAuthGate(session ? 'app' : 'login')} />
      </View>
    </View>
  );
}

function Root() {
  const { stack, role, toast, authGate } = useApp();
  if (authGate === 'splash') {
    return (
      <View style={styles.root}>
        <SplashScreen />
        {toast ? <ToastHost /> : null}
      </View>
    );
  }
  if (authGate === 'login') {
    return (
      <View style={styles.root}>
        <LoginScreen />
        {toast ? <ToastHost /> : null}
      </View>
    );
  }
  if (authGate === 'signup') {
    return (
      <View style={styles.root}>
        <SignupScreen />
        {toast ? <ToastHost /> : null}
      </View>
    );
  }
  if (authGate === 'adminPin') {
    return (
      <View style={styles.root}>
        <AdminPinScreen />
        {toast ? <ToastHost /> : null}
      </View>
    );
  }
  const screen = stack[stack.length - 1];
  const tabRoots: Screen[] =
    role === 'customer'
      ? ['home', 'bookings', 'chat', 'rewards', 'profile']
      : role === 'worker'
      ? ['jobs', 'earnings', 'chat', 'profile']
      : ['adminHome', 'adminFinance', 'adminUsers', 'profile'];
  const showTabs = tabRoots.includes(screen) && stack.length === 1;

  let body: React.ReactNode = null;
  switch (screen) {
    case 'home':
      body = <HomeScreen />;
      break;
    case 'service':
      body = <ServiceScreen />;
      break;
    case 'worker':
      body = <WorkerScreen />;
      break;
    case 'book':
      body = <BookScreen />;
      break;
    case 'pay':
      body = <PayScreen />;
      break;
    case 'done':
      body = <DoneScreen />;
      break;
    case 'bookings':
      body = <BookingsScreen />;
      break;
    case 'chat':
      body = <ChatListScreen />;
      break;
    case 'thread':
      body = <ThreadScreen />;
      break;
    case 'rewards':
      body = <RewardsScreen />;
      break;
    case 'profile':
      body = <ProfileScreen />;
      break;
    case 'jobs':
      body = <JobsScreen />;
      break;
    case 'earnings':
      body = <EarningsScreen />;
      break;
    case 'adminHome':
      body = <AdminHomeScreen />;
      break;
    case 'adminFinance':
      body = <AdminFinanceScreen />;
      break;
    case 'adminUsers':
      body = <AdminUsersScreen />;
      break;
    default:
      body = <HomeScreen />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.flex}>{body}</View>
      {showTabs ? <TabBar /> : null}
      {toast ? <ToastHost /> : null}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  if (!fontsLoaded) return null;
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RNStatusBar barStyle="light-content" />
        <AppProvider>
          <Root />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  flex: { flex: 1, backgroundColor: C.white },
  header: {
    backgroundColor: C.blue,
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { width: 44, height: 36, justifyContent: 'center' },
  headerTitle: { color: C.white, fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  headerSub: { color: C.blueMid, fontSize: 11, marginTop: 2, fontWeight: '500' },
  langChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  langChipTxt: { color: C.white, fontSize: 11, fontWeight: '700' },
  listPad: { padding: 16, paddingBottom: 32, backgroundColor: C.white },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cityTxt: { color: C.ink, fontWeight: '700', fontSize: 13 },
  trust: { color: C.mute, fontSize: 10, fontWeight: '600' },
  hello: { fontSize: 24, fontWeight: '800', color: C.ink },
  helloSub: { color: C.mute, marginTop: 4, marginBottom: 14, fontSize: 13 },
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.blueSoft,
    borderRadius: 16,
    padding: 12,
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.blueMid,
  },
  pointsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsLbl: { color: C.slate, fontSize: 11, fontWeight: '600' },
  pointsVal: { color: C.ink, fontSize: 18, fontWeight: '800' },
  pointsCta: { color: C.blue, fontSize: 11, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchInput: { flex: 1, color: C.ink, fontSize: 15, height: 46 },
  liveHint: { color: C.blue, fontSize: 11, fontWeight: '700', marginTop: 6 },
  chipRow: { gap: 8, paddingVertical: 14 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: C.blue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.white,
  },
  catChipOn: { backgroundColor: C.blue, borderColor: C.blue },
  catChipTxt: { color: C.blue, fontWeight: '700', fontSize: 12 },
  catChipTxtOn: { color: C.white },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.ink },
  sectionMeta: { color: C.mute, fontSize: 12, fontWeight: '600' },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.line,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  serviceIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconLg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceIconSm: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: { fontSize: 15, fontWeight: '800', color: C.ink },
  serviceDesc: { color: C.mute, fontSize: 12, marginTop: 2, lineHeight: 16 },
  priceTag: { backgroundColor: C.blue, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priceTagTxt: { color: C.white, fontWeight: '800', fontSize: 11 },
  badge: { backgroundColor: C.blue, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeSoft: { backgroundColor: C.blueSoft },
  badgeTxt: { color: C.white, fontSize: 10, fontWeight: '800' },
  workerCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.line,
  },
  workerName: { fontSize: 15, fontWeight: '800', color: C.ink },
  workerMeta: { color: C.mute, fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  starN: { color: C.slate, fontSize: 11, fontWeight: '700', marginLeft: 4 },
  metaDot: { color: C.mute, marginHorizontal: 6 },
  avail: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, gap: 4 },
  availDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  availTxt: { color: C.success, fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 36 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: { fontWeight: '800', color: C.ink, fontSize: 15 },
  emptySub: { color: C.mute, marginTop: 4, fontSize: 12 },
  primaryBtn: {
    backgroundColor: C.blue,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnTxt: { color: C.white, fontWeight: '800', fontSize: 15 },
  ghostBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
  },
  ghostBtnTxt: { color: C.blue, fontWeight: '800', fontSize: 14 },
  infoCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.line,
    marginBottom: 12,
  },
  infoLead: { color: C.slate, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  includeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  includeTxt: { color: C.slate, fontSize: 13 },
  body: { color: C.slate, fontSize: 13, lineHeight: 19, marginTop: 4 },
  proHero: { alignItems: 'center', paddingVertical: 8, marginBottom: 12 },
  proName: { fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 10 },
  proRole: { color: C.mute, marginTop: 4, fontSize: 13 },
  lockCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: C.blueSoft,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  lockTitle: { fontWeight: '800', color: C.ink, fontSize: 14 },
  lockTxt: { color: C.slate, fontSize: 12, marginTop: 3 },
  reviewCard: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    backgroundColor: C.white,
  },
  reviewAuthor: { fontWeight: '700', color: C.ink, fontSize: 13 },
  fieldLbl: { fontWeight: '800', color: C.ink, marginTop: 14, marginBottom: 8, fontSize: 13 },
  dayChip: {
    width: 54,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.white,
  },
  dayChipOn: { backgroundColor: C.blue, borderColor: C.blue },
  dayMon: { fontSize: 10, color: C.mute, fontWeight: '700' },
  dayNum: { fontSize: 18, fontWeight: '800', color: C.ink },
  timeChip: {
    borderWidth: 1.5,
    borderColor: C.blue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: C.white,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: C.blueSoft,
    alignSelf: 'flex-start',
    borderRadius: 14,
    padding: 6,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepVal: { fontWeight: '800', color: C.ink, minWidth: 80, textAlign: 'center' },
  input: {
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    color: C.ink,
    backgroundColor: C.white,
    fontSize: 14,
  },
  lockMini: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  lockMiniTxt: { color: C.slate, fontSize: 11, flex: 1 },
  sumCard: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 14,
    marginVertical: 16,
    backgroundColor: C.white,
  },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sumLbl: { color: C.mute, fontSize: 13 },
  sumVal: { color: C.ink, fontWeight: '700', fontSize: 13 },
  totalRow: { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10, marginTop: 4 },
  totalLbl: { fontWeight: '800', color: C.ink, fontSize: 15 },
  totalVal: { fontWeight: '800', color: C.blue, fontSize: 18 },
  hint: { color: C.mute, fontSize: 11, lineHeight: 16 },
  pointsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: C.blue,
    borderRadius: 14,
    padding: 12,
    backgroundColor: C.white,
  },
  pointsToggleOn: { backgroundColor: C.blueSoft },
  toggleTitle: { fontWeight: '800', color: C.ink, fontSize: 13 },
  toggleSub: { color: C.mute, fontSize: 11, marginTop: 2 },
  toggleAmt: { fontWeight: '800', color: C.blue },
  payMethods: { gap: 8 },
  payMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 14,
    padding: 12,
    backgroundColor: C.white,
  },
  payMethodOn: { backgroundColor: C.blue, borderColor: C.blue },
  payMethodTitle: { fontWeight: '800', color: C.ink, fontSize: 13 },
  payMethodHint: { color: C.mute, fontSize: 11, marginTop: 2 },
  stripeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginVertical: 14 },
  stripeTxt: { color: C.mute, fontSize: 11, fontWeight: '600' },
  busyRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 },
  busyTxt: { color: C.blue, fontWeight: '700' },
  successHero: { alignItems: 'center', paddingVertical: 18 },
  successRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: C.ink },
  successSub: { color: C.mute, marginTop: 4 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 12 },
  k: { color: C.mute, fontSize: 12, flex: 1 },
  v: { color: C.ink, fontWeight: '700', fontSize: 12, flex: 1.2, textAlign: 'right' },
  rewardCard: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1.5,
    borderColor: C.blue,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: C.white,
    alignItems: 'center',
  },
  seg: { flexDirection: 'row', margin: 16, backgroundColor: C.mist, borderRadius: 12, padding: 4 },
  segItem: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  segOn: { backgroundColor: C.blue },
  segTxt: { color: C.slate, fontWeight: '700', fontSize: 12 },
  segTxtOn: { color: C.white },
  bookCard: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: C.white,
    gap: 6,
  },
  bookId: { color: C.blue, fontWeight: '800', fontSize: 12 },
  addrBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.blueSoft,
    borderRadius: 10,
    padding: 8,
  },
  addrTxt: { color: C.ink, fontSize: 12, flex: 1, fontWeight: '600' },
  bookActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: C.blue,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: C.white,
  },
  smallBtnSolid: { backgroundColor: C.blue, borderColor: C.blue },
  smallBtnTxt: { color: C.blue, fontWeight: '800', fontSize: 12 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  msgPad: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  bubbleMe: { backgroundColor: C.blue, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: C.mist, alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleTxt: { color: C.ink, fontSize: 14, lineHeight: 19 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: C.line,
    backgroundColor: C.white,
  },
  composerInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 22,
    paddingHorizontal: 14,
    color: C.ink,
    backgroundColor: C.white,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceHero: {
    backgroundColor: C.blue,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  balanceLbl: { color: C.blueMid, fontWeight: '700', fontSize: 12 },
  balanceVal: { color: C.white, fontSize: 36, fontWeight: '800', marginVertical: 6 },
  miniStat: { marginRight: 24 },
  miniK: { color: C.blueMid, fontSize: 11 },
  miniV: { color: C.white, fontWeight: '800', fontSize: 16 },
  flowGrid: { flexDirection: 'row', gap: 8, marginTop: 8 },
  flowCell: {
    flex: 1,
    backgroundColor: C.blueSoft,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  flowN: { color: C.blue, fontWeight: '800', fontSize: 16 },
  flowL: { color: C.slate, fontSize: 10, textAlign: 'center', marginTop: 4, fontWeight: '600' },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  logDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.blue },
  logLbl: { fontWeight: '700', color: C.ink, fontSize: 13 },
  logAmt: { fontWeight: '800', color: C.ink },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  kpi: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  kpiL: { color: C.mute, fontSize: 11, fontWeight: '700' },
  kpiV: { color: C.blue, fontSize: 20, fontWeight: '800', marginTop: 4 },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, marginTop: 8 },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 14, backgroundColor: C.blue, borderRadius: 6 },
  barLbl: { fontSize: 10, color: C.mute, marginTop: 4, fontWeight: '700' },
  track: { height: 8, backgroundColor: C.mist, borderRadius: 4, overflow: 'hidden', marginTop: 6 },
  trackFill: { height: 8, backgroundColor: C.blue, borderRadius: 4 },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  settingLbl: { flex: 1, fontWeight: '700', color: C.ink, fontSize: 14 },
  settingVal: { color: C.mute, fontSize: 12, fontWeight: '600', maxWidth: 140, textAlign: 'right' },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: C.line,
    backgroundColor: C.white,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 3 },
  tabLbl: { fontSize: 10, color: C.mute, fontWeight: '600' },
  dot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.blue,
  },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: C.blue,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeTxt: { color: C.white, fontSize: 9, fontWeight: '800' },
  toast: {
    position: 'absolute',
    bottom: 92,
    alignSelf: 'center',
    backgroundColor: C.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toastTxt: { color: C.white, fontWeight: '700', fontSize: 12 },
  modalBg: { flex: 1, backgroundColor: 'rgba(15,23,42,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: 32,
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: C.ink, marginBottom: 10 },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  sheetRowOn: { backgroundColor: C.blueSoft, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 10, borderBottomWidth: 0 },
  sheetFlag: { fontSize: 18 },
  sheetLbl: { flex: 1, fontWeight: '700', color: C.ink },
  langChipDark: {
    backgroundColor: C.blueSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.blueMid,
  },
  langChipDarkTxt: { color: C.blue, fontSize: 11, fontWeight: '700' },
  gatePad: { padding: 20, paddingBottom: 40, backgroundColor: C.white },
  splashHero: { alignItems: 'center', paddingTop: 8, paddingBottom: 18 },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  splashWelcome: { fontSize: 24, fontWeight: '800', color: C.ink, textAlign: 'center' },
  splashHello: { fontSize: 16, fontWeight: '700', color: C.blue, marginTop: 6, textAlign: 'center' },
  splashSub: { color: C.mute, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 19, paddingHorizontal: 8 },
  detectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.blueSoft,
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: C.blueMid,
  },
  detectTitle: { color: C.ink, fontWeight: '800', fontSize: 13 },
  detectSub: { color: C.slate, fontSize: 11, marginTop: 2, flexShrink: 1 },
  detectDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.blue },
  splashGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  splashCat: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  splashCatName: { color: C.ink, fontWeight: '800', fontSize: 11, marginTop: 6, textAlign: 'center' },
  splashCatPrice: { color: C.blue, fontWeight: '800', fontSize: 11, marginTop: 2 },
  linkRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 },
  linkMuted: { color: C.mute, fontSize: 13 },
  linkBlue: { color: C.blue, fontWeight: '800', fontSize: 13 },
  staffRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 22 },
  staffTxt: { color: C.blue, fontWeight: '700', fontSize: 12 },
  pinWrap: { flex: 1, padding: 20, backgroundColor: C.white },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginVertical: 22 },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.blue,
    backgroundColor: C.white,
  },
  pinDotOn: { backgroundColor: C.blue },
  pad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 18 },
  padKey: {
    width: '30%',
    height: 58,
    borderRadius: 16,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padTxt: { fontSize: 18, fontWeight: '800', color: C.ink },
});
