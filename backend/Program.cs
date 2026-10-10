using System;
using System.Threading;
using JanisonAssessment.Backend.HttpServer;
using JanisonAssessment.Backend.Services;

namespace JanisonAssessment.Backend
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.Title = "Janison Assessment Platform - .NET Framework 4.8";

            Console.WriteLine("==================================================================");
            Console.WriteLine("   JANISON DIGITAL ASSESSMENT PLATFORM - BACKEND ENGINE");
            Console.WriteLine("   Tech Stack: .NET Framework 4.8 | C# | High-Throughput REST API");
            Console.WriteLine("==================================================================");

            var assessmentRepo = new AssessmentRepository();
            var gradingEngine = new GradingEngine();
            var sessionService = new ExamSessionService(assessmentRepo, gradingEngine);
            var analyticsService = new AnalyticsService(assessmentRepo, sessionService);

            string hostPrefix = "http://localhost:5000/";
            if (args.Length > 0 && !string.IsNullOrWhiteSpace(args[0]))
            {
                hostPrefix = args[0];
            }

            var server = new JanisonHttpServer(hostPrefix, assessmentRepo, sessionService, analyticsService);
            server.Start();

            Console.WriteLine($"-> API Health:      {hostPrefix}api/health");
            Console.WriteLine($"-> Assessments:     {hostPrefix}api/assessments");
            Console.WriteLine($"-> Exam Sessions:   {hostPrefix}api/sessions");
            Console.WriteLine($"-> Psychometrics:   {hostPrefix}api/analytics");
            Console.WriteLine("------------------------------------------------------------------");
            Console.WriteLine("Press Ctrl+C to stop the server...");

            var autoResetEvent = new AutoResetEvent(false);
            Console.CancelKeyPress += (sender, eventArgs) =>
            {
                eventArgs.Cancel = true;
                server.Stop();
                autoResetEvent.Set();
            };

            autoResetEvent.WaitOne();
            Console.WriteLine("[Janison Backend] Shutdown completed gracefully.");
        }
    }
}
