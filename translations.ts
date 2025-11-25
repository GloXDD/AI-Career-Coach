
import { AppLanguage } from "./types";

export const translations: Record<AppLanguage, any> = {
  en: {
    nav_title: "AI Career Coach",
    new_session: "New Session",
    
    // Onboarding
    hero_title: "Discover.\nApply.\nSucceed.",
    hero_subtitle: "Upload your CV to unlock AI-driven career paths, find live job openings, and get tailored optimization.",
    step_1: "Upload CV",
    ready_scanning: "Ready for scanning",
    drop_pdf: "Drop your PDF here",
    click_browse: "or click to browse",
    step_2: "Preferences",
    placeholder_location: "Location (e.g. Paris, Remote)",
    placeholder_role: "Desired Role (Optional)",
    btn_scan: "Scan Career Opportunities",
    error_no_cv: "Please upload a CV.",
    error_pdf_only: "Please upload a valid PDF file.",
    
    // Loading
    loading_discovery: "Analyzing profile & scanning market...",
    loading_analysis: "Optimizing CV for selected role...",
    loading_feedback: "Analyzing interview performance...",
    
    // Discovery
    market_analysis: "Market Analysis",
    suggested_paths: "Suggested Career Paths",
    match_reason: "Match Reason",
    live_opportunities: "Live Opportunities Found",
    view_listing: "View Original Listing",
    source_unavailable: "Source not directly available",
    btn_improve_cv: "Improve CV for this Role",
    no_jobs_found: "No specific jobs found matching exact criteria. Try broadening your location or career focus.",
    
    // Analysis Results
    optimizing_for: "Optimizing For",
    change_job: "Change Job",
    match_score: "Match",
    analysis_label: "Analysis",
    suggested_header: "Suggested Header Summary",
    top_priority: "Top Priority",
    critical_improvements: "Critical Improvements",
    
    // Tabs
    tab_beautiful: "Beautiful Version",
    tab_ats: "ATS Optimized",
    
    // Next Step
    prepare_interview: "Prepare for the Interview",
    prepare_interview_desc: "Enter the simulator to practice answering questions tailored to your new profile.",
    select_interview_lang: "Select Interview Language",
    btn_start_sim: "Start Simulation",
    
    // Interview
    back_analysis: "Back to Analysis",
    prep_notes: "Preparation Notes",
    prep_notes_desc: "Review these points before starting. The AI interviewer will challenge you on your experience gaps and ask for specific examples.",
    
    // Feedback Report
    report_title: "Interview Performance Report",
    report_score: "Performance Score",
    tone_analysis: "Tone Analysis",
    strengths: "Key Strengths",
    areas_improvement: "Areas for Improvement",
    qa_breakdown: "Q&A Breakdown",
    user_said: "You Said",
    feedback: "Feedback",
    better_answer: "Better Answer",
    back_to_results: "Back to CV",
    retry_interview: "Retry Interview"
  },
  fr: {
    nav_title: "Coach Carrière IA",
    new_session: "Nouvelle Session",
    
    // Onboarding
    hero_title: "Découvrez.\nPostulez.\nRéussissez.",
    hero_subtitle: "Téléchargez votre CV pour débloquer des parcours de carrière IA, trouver des offres d'emploi, et obtenir une optimisation sur mesure.",
    step_1: "Télécharger CV",
    ready_scanning: "Prêt pour l'analyse",
    drop_pdf: "Déposez votre PDF ici",
    click_browse: "ou cliquez pour parcourir",
    step_2: "Préférences",
    placeholder_location: "Lieu (ex: Paris, Télétravail)",
    placeholder_role: "Poste visé (Optionnel)",
    btn_scan: "Scanner les Opportunités",
    error_no_cv: "Veuillez télécharger un CV.",
    error_pdf_only: "Veuillez télécharger un fichier PDF valide.",
    
    // Loading
    loading_discovery: "Analyse du profil & scan du marché...",
    loading_analysis: "Optimisation du CV pour le poste...",
    loading_feedback: "Analyse de la performance d'entretien...",
    
    // Discovery
    market_analysis: "Analyse du Marché",
    suggested_paths: "Parcours de Carrière Suggérés",
    match_reason: "Raison de la correspondance",
    live_opportunities: "Offres Trouvées",
    view_listing: "Voir l'offre originale",
    source_unavailable: "Source non disponible",
    btn_improve_cv: "Améliorer le CV pour ce rôle",
    no_jobs_found: "Aucune offre spécifique trouvée. Essayez d'élargir votre recherche.",
    
    // Analysis Results
    optimizing_for: "Optimisation Pour",
    change_job: "Changer d'offre",
    match_score: "Score",
    analysis_label: "Analyse",
    suggested_header: "Résumé de Profil Suggéré",
    top_priority: "Priorité Haute",
    critical_improvements: "Améliorations Critiques",
    
    // Tabs
    tab_beautiful: "Version Esthétique",
    tab_ats: "Version Optimisée ATS",
    
    // Next Step
    prepare_interview: "Préparer l'Entretien",
    prepare_interview_desc: "Entrez dans le simulateur pour vous entraîner à répondre aux questions adaptées à votre nouveau profil.",
    select_interview_lang: "Langue de l'entretien",
    btn_start_sim: "Lancer la Simulation",
    
    // Interview
    back_analysis: "Retour à l'analyse",
    prep_notes: "Notes de Préparation",
    prep_notes_desc: "Lisez ces points avant de commencer. L'IA vous interrogera sur vos lacunes et demandera des exemples précis.",

    // Feedback Report
    report_title: "Rapport de Performance",
    report_score: "Score de Performance",
    tone_analysis: "Analyse du Ton",
    strengths: "Points Forts",
    areas_improvement: "Axes d'Amélioration",
    qa_breakdown: "Détail Questions/Réponses",
    user_said: "Vous avez dit",
    feedback: "Feedback",
    better_answer: "Meilleure Réponse",
    back_to_results: "Retour au CV",
    retry_interview: "Refaire l'Entretien"
  },
  zh: {
    nav_title: "AI 职业教练",
    new_session: "新会话",
    
    // Onboarding
    hero_title: "发现机会。\n申请职位。\n获得成功。",
    hero_subtitle: "上传您的简历，解锁 AI 驱动的职业路径，寻找实时职位空缺，并获得量身定制的优化建议。",
    step_1: "上传简历",
    ready_scanning: "准备扫描",
    drop_pdf: "将 PDF 拖放到此处",
    click_browse: "或点击浏览",
    step_2: "偏好设置",
    placeholder_location: "地点 (例如: 上海, 远程)",
    placeholder_role: "期望职位 (可选)",
    btn_scan: "扫描职业机会",
    error_no_cv: "请上传简历。",
    error_pdf_only: "请上传有效的 PDF 文件。",
    
    // Loading
    loading_discovery: "正在分析个人资料并扫描市场...",
    loading_analysis: "正在针对所选职位优化简历...",
    loading_feedback: "正在分析面试表现...",
    
    // Discovery
    market_analysis: "市场分析",
    suggested_paths: "建议的职业路径",
    match_reason: "匹配理由",
    live_opportunities: "发现的实时机会",
    view_listing: "查看原始职位",
    source_unavailable: "来源暂不可用",
    btn_improve_cv: "针对此职位改进简历",
    no_jobs_found: "未找到符合具体条件的职位。请尝试扩大地点或职业关注范围。",
    
    // Analysis Results
    optimizing_for: "正在优化",
    change_job: "更换职位",
    match_score: "匹配度",
    analysis_label: "分析",
    suggested_header: "建议的简历摘要",
    top_priority: "最高优先级",
    critical_improvements: "关键改进",
    
    // Tabs
    tab_beautiful: "精美版本",
    tab_ats: "ATS 优化版",
    
    // Next Step
    prepare_interview: "准备面试",
    prepare_interview_desc: "进入模拟器，练习回答针对您新个人资料定制的问题。",
    select_interview_lang: "选择面试语言",
    btn_start_sim: "开始模拟",
    
    // Interview
    back_analysis: "返回分析",
    prep_notes: "准备笔记",
    prep_notes_desc: "开始前请阅读这些要点。AI 面试官将挑战您的经验差距并要求提供具体示例。",

    // Feedback Report
    report_title: "面试表现报告",
    report_score: "表现评分",
    tone_analysis: "语气分析",
    strengths: "主要优势",
    areas_improvement: "改进领域",
    qa_breakdown: "问答详解",
    user_said: "您的回答",
    feedback: "反馈",
    better_answer: "更好的回答",
    back_to_results: "返回简历",
    retry_interview: "重试面试"
  }
};
