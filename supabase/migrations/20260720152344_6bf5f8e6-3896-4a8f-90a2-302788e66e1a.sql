
-- SITE SETTINGS (singleton)
CREATE TABLE public.site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  business_name_ar TEXT NOT NULL DEFAULT 'رنين نيلز',
  business_name_he TEXT NOT NULL DEFAULT 'רנין ניילז',
  tagline_ar TEXT NOT NULL DEFAULT 'فن الأظافر بلمسة أنثوية',
  tagline_he TEXT NOT NULL DEFAULT 'אומנות הציפורניים במגע נשי',
  logo_url TEXT,
  hero_title_ar TEXT NOT NULL DEFAULT 'جمال أظافرك يبدأ هنا',
  hero_title_he TEXT NOT NULL DEFAULT 'היופי של הציפורניים שלך מתחיל כאן',
  hero_subtitle_ar TEXT NOT NULL DEFAULT 'صالون رنين — تجربة فاخرة للعناية بالأظافر والحواجب في دير الاسد',
  hero_subtitle_he TEXT NOT NULL DEFAULT 'סלון רנין — חוויה יוקרתית לטיפוח ציפורניים וגבות בדיר אל-אסד',
  hero_image_url TEXT,
  about_title_ar TEXT NOT NULL DEFAULT 'عن الصالون',
  about_title_he TEXT NOT NULL DEFAULT 'על הסלון',
  about_text_ar TEXT NOT NULL DEFAULT 'صالون رنين هو وجهتك للعناية بالأظافر والحواجب في دير الاسد. أناقة، نظافة ولمسة فنية في كل تفصيل.',
  about_text_he TEXT NOT NULL DEFAULT 'סלון רנין הוא היעד שלך לטיפוח ציפורניים וגבות בדיר אל-אסד. אלגנטיות, ניקיון ומגע אומנותי בכל פרט.',
  phone TEXT NOT NULL DEFAULT '0502204606',
  whatsapp TEXT NOT NULL DEFAULT '972502204606',
  instagram TEXT DEFAULT '',
  address_ar TEXT NOT NULL DEFAULT 'دير الاسد',
  address_he TEXT NOT NULL DEFAULT 'דיר אל-אסד',
  maps_url TEXT DEFAULT 'https://maps.google.com/?q=دير+الاسد',
  hours_text_ar TEXT NOT NULL DEFAULT 'كل يوم 10:00 - 18:00 (الإثنين مغلق)',
  hours_text_he TEXT NOT NULL DEFAULT 'כל יום 10:00 - 18:00 (יום שני סגור)',
  footer_text_ar TEXT NOT NULL DEFAULT 'صالون رنين نيلز — دير الاسد',
  footer_text_he TEXT NOT NULL DEFAULT 'סלון רנין ניילז — דיר אל-אסד',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_site_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.site_settings (id) VALUES (1);

-- STATS
CREATE TABLE public.stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_ar TEXT NOT NULL,
  label_he TEXT NOT NULL,
  value INT NOT NULL DEFAULT 0,
  suffix TEXT DEFAULT '+',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stats TO authenticated;
GRANT ALL ON public.stats TO service_role;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active stats" ON public.stats FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage stats" ON public.stats FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_stats_updated BEFORE UPDATE ON public.stats FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.stats (label_ar, label_he, value, suffix, sort_order) VALUES
  ('عميلة سعيدة', 'לקוחות מרוצות', 500, '+', 1),
  ('موعد مكتمل', 'תורים שהושלמו', 1200, '+', 2),
  ('سنوات خبرة', 'שנות ניסיון', 5, '+', 3),
  ('تقييم العملاء', 'דירוג לקוחות', 5, '★', 4);

-- ABOUT CARDS
CREATE TABLE public.about_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon TEXT NOT NULL DEFAULT 'Sparkles',
  title_ar TEXT NOT NULL,
  title_he TEXT NOT NULL,
  text_ar TEXT NOT NULL,
  text_he TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.about_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.about_cards TO authenticated;
GRANT ALL ON public.about_cards TO service_role;
ALTER TABLE public.about_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active about" ON public.about_cards FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage about" ON public.about_cards FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_about_updated BEFORE UPDATE ON public.about_cards FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.about_cards (icon, title_ar, title_he, text_ar, text_he, sort_order) VALUES
  ('Sparkles', 'أناقة وفن', 'אלגנטיות ואומנות', 'تصاميم عصرية بلمسة فنية تليق بأناقتك', 'עיצובים מודרניים במגע אומנותי', 1),
  ('ShieldCheck', 'نظافة ومعايير عالية', 'ניקיון וסטנדרטים גבוהים', 'نستخدم أدوات معقمة ومنتجات عالية الجودة', 'משתמשות בכלים סטריליים ומוצרים איכותיים', 2),
  ('Heart', 'خبرة ورعاية', 'ניסיון ותשומת לב', 'اهتمام شخصي بكل زبونة وتفاصيلها الخاصة', 'תשומת לב אישית לכל לקוחה', 3);

-- TESTIMONIALS
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  text_ar TEXT NOT NULL,
  text_he TEXT NOT NULL,
  rating INT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active testimonials" ON public.testimonials FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_testimonials_updated BEFORE UPDATE ON public.testimonials FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.testimonials (name, text_ar, text_he, rating, sort_order) VALUES
  ('سارة', 'أفضل صالون في المنطقة! نتيجة رائعة واهتمام مذهل', 'הסלון הכי טוב באזור! תוצאה מדהימה ותשומת לב יוצאת דופן', 5, 1),
  ('ليان', 'رنين فنانة حقيقية، أظافري لم تبدُ أجمل من قبل', 'רנין אמנית אמיתית, הציפורניים שלי מעולם לא נראו יפה יותר', 5, 2),
  ('نور', 'مكان نظيف، أجواء راقية وأسعار عادلة', 'מקום נקי, אווירה יוקרתית ומחירים הוגנים', 5, 3);

-- FAQS
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_ar TEXT NOT NULL,
  question_he TEXT NOT NULL,
  answer_ar TEXT NOT NULL,
  answer_he TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active faqs" ON public.faqs FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage faqs" ON public.faqs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_faqs_updated BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.faqs (question_ar, question_he, answer_ar, answer_he, sort_order) VALUES
  ('كيف أحجز موعداً؟', 'איך קובעים תור?', 'يمكنك الحجز مباشرة من الموقع باختيار الخدمة والتاريخ والوقت المناسب', 'אפשר לקבוע ישירות מהאתר על ידי בחירת שירות, תאריך ושעה', 1),
  ('هل يوجد مواقف سيارات؟', 'האם יש חניה?', 'نعم، تتوفر مواقف مجانية بالقرب من الصالون', 'כן, ישנן חניות חינם ליד הסלון', 2),
  ('ما هي طرق الدفع؟', 'מהן דרכי התשלום?', 'نقبل النقد وجميع بطاقات الائتمان', 'מקבלות מזומן וכל כרטיסי האשראי', 3);

-- SERVICES: add descriptions
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS description_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_he TEXT;
