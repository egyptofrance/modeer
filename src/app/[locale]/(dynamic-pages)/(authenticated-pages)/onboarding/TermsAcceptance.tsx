import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, startOfMonth } from "date-fns";
import { useOnboarding } from "./OnboardingContext";

export function TermsAcceptance() {
  const { acceptTermsActionState } = useOnboarding();

  return (
    <>
      <CardHeader>
        <CardTitle
          data-testid="terms-acceptance-title"
          className="text-2xl font-bold mb-2"
        >
          مرحباً بك في نظام Modeer لإدارة الموظفين
        </CardTitle>
        <CardDescription>
          يرجى قراءة شروط الاستخدام قبل المتابعة.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">شروط الاستخدام</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Last updated: {format(startOfMonth(new Date()), "MMMM d, yyyy")}
          </p>
          <div className="max-h-40 overflow-y-auto text-sm">
            <p className="mb-3">
              <strong>1. قبول الشروط:</strong> باستخدامك لنظام Modeer، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام النظام.
            </p>
            <p className="mb-3">
              <strong>2. الاستخدام المسموح:</strong> يُسمح لك باستخدام النظام فقط للأغراض المتعلقة بعملك في الشركة. يُحظر استخدام النظام لأي أغراض غير قانونية أو غير مصرح بها.
            </p>
            <p className="mb-3">
              <strong>3. سرية المعلومات:</strong> تتعهد بالحفاظ على سرية جميع المعلومات التي تحصل عليها من خلال النظام، وعدم مشاركتها مع أي طرف ثالث دون إذن مسبق.
            </p>
            <p className="mb-3">
              <strong>4. حماية البيانات:</strong> نحن ملتزمون بحماية بياناتك الشخصية وفقاً لقوانين حماية البيانات المعمول بها. لن يتم مشاركة معلوماتك مع أطراف خارجية دون موافقتك.
            </p>
            <p className="mb-3">
              <strong>5. المسؤولية:</strong> أنت مسؤول عن جميع الأنشطة التي تتم من خلال حسابك. يجب عليك الحفاظ على سرية كلمة المرور الخاصة بك وإبلاغنا فوراً في حالة أي استخدام غير مصرح به.
            </p>
            <p className="mb-3">
              <strong>6. التعديلات:</strong> نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          data-testid="accept-terms-button"
          onClick={() => acceptTermsActionState.execute()}
          disabled={acceptTermsActionState.status === "executing"}
          className="w-full"
        >
          {acceptTermsActionState.status === "executing"
            ? "جاري القبول..."
            : "قبول الشروط"}
        </Button>
      </CardFooter>
    </>
  );
}
