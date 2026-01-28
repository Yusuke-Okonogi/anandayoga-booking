'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] py-12 px-4 sm:px-6 lg:px-8 font-sans text-stone-700">
      <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-stone-200">
        
        {/* ヘッダー部分 */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-stone-800 mb-4">
            プライバシーポリシー
          </h1>
          <div className="w-16 h-1 bg-[#EEA51A] mx-auto rounded-full"></div>
        </div>

        {/* コンテンツ */}
        <div className="space-y-10 text-sm md:text-base leading-relaxed">
          <p>
            本ウェブサイトは、メロンワークス合同会社（以下「当社」）のウェルネス事業であるアナンダヨガのウェブサイトです。
          </p>

          <section>
            <h2 className="text-lg font-bold text-[#EEA51A] mb-3 flex items-center gap-2">
              <span className="bg-[#FFF8E1] w-6 h-6 flex items-center justify-center rounded-full text-sm">1</span>
              個人情報に関する基本方針
            </h2>
            <p>
              当社は、以下のとおり個人情報保護方針を定め、個人情報保護の仕組みを構築し、全従業員に個人情報保護の重要性の認識と取組みを徹底させることにより、個人情報の保護を推進致します。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#EEA51A] mb-3 flex items-center gap-2">
              <span className="bg-[#FFF8E1] w-6 h-6 flex items-center justify-center rounded-full text-sm">2</span>
              個人情報の管理
            </h2>
            <p>
              当社は、お客さまの個人情報を正確かつ最新の状態に保ち、個人情報への不正アクセス・紛失・破損・改ざん・漏洩などを防止するため、管理体制の整備・社員教育の徹底等の必要な措置を講じ、安全対策を実施し個人情報の厳重な管理を行ないます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#EEA51A] mb-3 flex items-center gap-2">
              <span className="bg-[#FFF8E1] w-6 h-6 flex items-center justify-center rounded-full text-sm">3</span>
              個人情報の利用目的
            </h2>
            <p>
              本ウェブサイトでは、お客様からのお問い合わせ時に、お名前、メールアドレス、電話番号等の個人情報をご登録いただく場合がございますが、これらの個人情報はご提供いただく際の目的以外では利用いたしません。 お客さまからお預かりした個人情報は、当社からのご連絡や業務のご案内やご質問に対する回答として、電子メールや資料のご送付に利用いたします。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#EEA51A] mb-3 flex items-center gap-2">
              <span className="bg-[#FFF8E1] w-6 h-6 flex items-center justify-center rounded-full text-sm">4</span>
              個人情報の第三者への開示・提供の禁止
            </h2>
            <p className="mb-2">
              当社は、お客さまよりお預かりした個人情報を適切に管理し、次のいずれかに該当する場合を除き、個人情報を第三者に開示いたしません。
            </p>
            <ul className="list-disc pl-6 space-y-1 text-stone-600 bg-stone-50 p-4 rounded-xl border border-stone-100">
              <li>お客さまの同意がある場合</li>
              <li>お客さまが希望されるサービスを行なうために当社が業務を委託する業者に対して開示する場合</li>
              <li>法令に基づき開示することが必要である場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#EEA51A] mb-3 flex items-center gap-2">
              <span className="bg-[#FFF8E1] w-6 h-6 flex items-center justify-center rounded-full text-sm">5</span>
              個人情報の安全対策
            </h2>
            <p>
              当社は、個人情報の正確性及び安全性確保のために、セキュリティに万全の対策を講じています。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#EEA51A] mb-3 flex items-center gap-2">
              <span className="bg-[#FFF8E1] w-6 h-6 flex items-center justify-center rounded-full text-sm">6</span>
              ご本人の照会
            </h2>
            <p>
              お客さまがご本人の個人情報の照会・修正・削除などをご希望される場合には、ご本人であることを確認の上、対応させていただきます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#EEA51A] mb-3 flex items-center gap-2">
              <span className="bg-[#FFF8E1] w-6 h-6 flex items-center justify-center rounded-full text-sm">7</span>
              法令、規範の遵守と見直し
            </h2>
            <p>
              当社は、保有する個人情報に関して適用される日本の法令、その他規範を遵守するとともに、本ポリシーの内容を適宜見直し、その改善に努めます。
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#EEA51A] mb-3 flex items-center gap-2">
              <span className="bg-[#FFF8E1] w-6 h-6 flex items-center justify-center rounded-full text-sm">8</span>
              免責事項
            </h2>
            <div className="space-y-3">
              <p>
                本ウェブサイトの情報は、無料で提供されています。当サイトを利用したウェブサイトの閲覧や情報収集については、情報がユーザーの需要に適合するものか否か、情報の保存や複製その他ユーザーによる任意の利用方法により必要な法的権利を有しているか否か、著作権、秘密保持、名誉毀損、品位保持および輸出に関する法規その他法令上の義務に従うことなど、ユーザーご自身の責任において行っていただきますようお願いいたします。
              </p>
              <p>
                当サイトの御利用につき、何らかのトラブルや損失・損害等につきましては一切責任を問わないものとします。
              </p>
              <p>
                当サイトが紹介しているウェブサイトやソフトウェアの合法性、正確性、道徳性、最新性、適切性、著作権の許諾や有無など、その内容については一切の保証を致しかねます。
              </p>
              <p>
                当サイトからリンクやバナーなどによって他のサイトに移動された場合、移動先サイトで提供される情報、サービス等について一切の責任を負いません。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#EEA51A] mb-3 flex items-center gap-2">
              <span className="bg-[#FFF8E1] w-6 h-6 flex items-center justify-center rounded-full text-sm">9</span>
              著作権
            </h2>
            <p>
              本ウェブサイトに掲載されている全てのコンテンツは、当社が所有しています。書面による許可なく、個人的な目的以外で使用することは禁止されています。
            </p>
          </section>

          {/* お問い合わせ窓口 */}
          <div className="border-t border-stone-200 pt-10 mt-12">
            <h2 className="text-lg font-bold text-stone-800 mb-4">お問い合せ窓口</h2>
            <p className="mb-4 text-stone-600">当社の個人情報の取扱に関するお問い合せは下記までご連絡ください。</p>
            <div className="bg-[#FDFBF7] p-6 rounded-xl border border-stone-100 text-stone-700 shadow-sm">
              <p className="font-bold text-lg mb-2">メロンワークス合同会社</p>
              <p>〒371-0831</p>
              <p>群馬県前橋市小相木町327タカゼンビル203</p>
            </div>
          </div>

          <div className="text-center pt-8">
            <Link href="/" className="text-[#EEA51A] font-bold hover:underline">
              ← トップページへ戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}