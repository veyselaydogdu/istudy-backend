<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // Core / Lookup tables
            UserRolesTableSeeder::class,
            BloodTypesTableSeeder::class,
            CountriesTableSeeder::class,
            CurrenciesTableSeeder::class,
            ExchangeRatesTableSeeder::class,
            ExchangeRateLogsTableSeeder::class,
            AppSettingsTableSeeder::class,

            // Roles & Permissions
            RolesTableSeeder::class,
            RolesHistoriesTableSeeder::class,
            PermissionsTableSeeder::class,
            PermissionsHistoriesTableSeeder::class,
            PermissionRoleTableSeeder::class,
            RoleUserTableSeeder::class,

            // Packages & Subscriptions
            PackagesTableSeeder::class,
            PackagesHistoriesTableSeeder::class,
            PackageFeaturesTableSeeder::class,
            PackageFeaturePivotTableSeeder::class,
            SubscriptionPlansTableSeeder::class,
            SubscriptionPlansHistoriesTableSeeder::class,
            PlanTierPricingTableSeeder::class,
            PlanTierPricingHistoriesTableSeeder::class,
            RevenueSharesTableSeeder::class,
            RevenueSharesHistoriesTableSeeder::class,

            // Users & Tenants
            UsersTableSeeder::class,
            UsersHistoriesTableSeeder::class,
            UserContactNumbersTableSeeder::class,
            TenantsTableSeeder::class,
            TenantsHistoriesTableSeeder::class,
            TenantSubscriptionsTableSeeder::class,
            TenantSubscriptionsHistoriesTableSeeder::class,
            TenantPaymentsTableSeeder::class,
            TenantPaymentsHistoriesTableSeeder::class,

            // Schools
            SchoolsTableSeeder::class,
            SchoolsHistoriesTableSeeder::class,
            SchoolRolesTableSeeder::class,
            SchoolRolesHistoriesTableSeeder::class,
            SchoolRolePermissionsTableSeeder::class,
            SchoolRolePermissionsHistoriesTableSeeder::class,
            SchoolUserRolesTableSeeder::class,
            SchoolUserRolesHistoriesTableSeeder::class,
            SchoolMealTypesTableSeeder::class,

            // Teachers
            TeacherProfilesTableSeeder::class,
            TeacherProfilesHistoriesTableSeeder::class,
            TeacherRoleTypesTableSeeder::class,
            TeacherSkillsTableSeeder::class,
            TeacherCertificatesTableSeeder::class,
            TeacherCoursesTableSeeder::class,
            TeacherEducationsTableSeeder::class,
            TeacherFollowsTableSeeder::class,
            TeacherBlogPostsTableSeeder::class,
            TeacherBlogCommentsTableSeeder::class,
            TeacherBlogLikesTableSeeder::class,
            TeacherTenantMembershipsTableSeeder::class,
            SchoolTeacherAssignmentsTableSeeder::class,

            // Classes & Academic Years
            AcademicYearsTableSeeder::class,
            AcademicYearsHistoriesTableSeeder::class,
            ClassesTableSeeder::class,
            ClassesHistoriesTableSeeder::class,
            ClassTeacherAssignmentsTableSeeder::class,

            // Children
            ChildrenTableSeeder::class,
            ChildrenHistoriesTableSeeder::class,
            ChildClassAssignmentsTableSeeder::class,
            ChildRemovalRequestsTableSeeder::class,
            ChildFieldChangeRequestsTableSeeder::class,
            ChildPricingSettingsTableSeeder::class,
            ChildPricingSettingsHistoriesTableSeeder::class,

            // Medical
            MedicalConditionsTableSeeder::class,
            MedicalConditionsHistoriesTableSeeder::class,
            ChildConditionsTableSeeder::class,
            MedicationsTableSeeder::class,
            MedicationsHistoriesTableSeeder::class,
            ChildMedicationsTableSeeder::class,
            ChildMedicationLogsTableSeeder::class,
            AllergensTableSeeder::class,
            AllergensHistoriesTableSeeder::class,
            ChildAllergensTableSeeder::class,

            // Families & Parents
            FamilyProfilesTableSeeder::class,
            FamilyProfilesHistoriesTableSeeder::class,
            FamilyMembersTableSeeder::class,
            FamilyMembersHistoriesTableSeeder::class,
            FamilyMemberChildrenTableSeeder::class,
            FamilySubscriptionsTableSeeder::class,
            FamilySubscriptionsHistoriesTableSeeder::class,
            EmergencyContactsTableSeeder::class,
            AuthorizedPickupsTableSeeder::class,
            AuthorizedPickupsHistoriesTableSeeder::class,
            ChildPickupLogsTableSeeder::class,

            // School Enrollment
            SchoolEnrollmentRequestsTableSeeder::class,
            SchoolEnrollmentRequestsHistoriesTableSeeder::class,
            SchoolChildEnrollmentRequestsTableSeeder::class,
            SchoolFamilyAssignmentsTableSeeder::class,

            // Attendance
            AttendancesTableSeeder::class,
            AttendancesHistoriesTableSeeder::class,

            // Meals & Food
            MealsTableSeeder::class,
            MealsHistoriesTableSeeder::class,
            FoodIngredientsTableSeeder::class,
            FoodIngredientsHistoriesTableSeeder::class,
            FoodIngredientAllergensTableSeeder::class,
            MealIngredientPivotTableSeeder::class,
            MealMenuSchedulesTableSeeder::class,
            MealMenuSchedulesHistoriesTableSeeder::class,

            // Activities
            ActivitiesTableSeeder::class,
            ActivitiesHistoriesTableSeeder::class,
            ActivityClassesTableSeeder::class,
            ActivityClassAssignmentsTableSeeder::class,
            ActivityClassSchoolClassAssignmentsTableSeeder::class,
            ActivityClassTeachersTableSeeder::class,
            ActivityClassEnrollmentsTableSeeder::class,
            ActivityClassGalleryTableSeeder::class,
            ActivityClassInvoicesTableSeeder::class,
            ActivityClassMaterialsTableSeeder::class,
            ActivityEnrollmentsTableSeeder::class,
            ActivityGalleryTableSeeder::class,
            ActivityPaymentsTableSeeder::class,
            ActivityPaymentsHistoriesTableSeeder::class,
            ChildActivityEnrollmentsTableSeeder::class,
            ActivityLogsTableSeeder::class,
            ActivityLogsArchiveTableSeeder::class,
            ActivityLogSummariesTableSeeder::class,

            // Materials & Homework
            MaterialsTableSeeder::class,
            MaterialsHistoriesTableSeeder::class,
            ChildMaterialTrackingsTableSeeder::class,
            HomeworkTableSeeder::class,
            HomeworkHistoriesTableSeeder::class,
            HomeworkClassAssignmentsTableSeeder::class,
            HomeworkCompletionsTableSeeder::class,
            HomeworkCompletionsHistoriesTableSeeder::class,

            // Events
            EventsTableSeeder::class,
            EventsHistoriesTableSeeder::class,
            ChildEventParticipationsTableSeeder::class,
            EventPaymentsTableSeeder::class,
            EventPaymentsHistoriesTableSeeder::class,

            // Announcements & Social
            AnnouncementsTableSeeder::class,
            AnnouncementsHistoriesTableSeeder::class,
            SocialPostsTableSeeder::class,
            SocialPostMediaTableSeeder::class,
            SocialPostClassTagsTableSeeder::class,
            SocialPostCommentsTableSeeder::class,
            SocialPostReactionsTableSeeder::class,

            // Reports
            ReportTemplatesTableSeeder::class,
            ReportTemplatesHistoriesTableSeeder::class,
            ReportTemplateInputsTableSeeder::class,
            ReportTemplateInputsHistoriesTableSeeder::class,
            ReportInputValuesTableSeeder::class,
            ReportInputValuesHistoriesTableSeeder::class,
            DailyChildReportsTableSeeder::class,
            DailyChildReportsHistoriesTableSeeder::class,

            // Invoices & Payments
            InvoicesTableSeeder::class,
            InvoicesHistoriesTableSeeder::class,
            InvoiceItemsTableSeeder::class,
            PaymentsTableSeeder::class,
            PaymentsHistoriesTableSeeder::class,
            TransactionsTableSeeder::class,
            TransactionsHistoriesTableSeeder::class,

            // Notifications
            SystemNotificationsTableSeeder::class,
            SystemNotificationsHistoriesTableSeeder::class,
            NotificationPreferencesTableSeeder::class,
            NotificationUserTableSeeder::class,

            // Audit & Misc
            AuditLogsTableSeeder::class,
            ContactRequestsTableSeeder::class,
        ]);
    }
}
