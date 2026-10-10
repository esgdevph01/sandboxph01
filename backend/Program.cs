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
            try
            {
                Console.Title = "Janison Assessment Platform";
            }
            catch { }

            Console.WriteLine("==================================================================");
            Console.WriteLine("   JANISON DIGITAL ASSESSMENT PLATFORM - BACKEND ENGINE");
            Console.WriteLine("   Tech Stack: C# / .NET | High-Throughput REST API");
            Console.WriteLine("==================================================================");

            var assessmentRepo = new AssessmentRepository();
            var gradingEngine = new GradingEngine();
            var sessionService = new ExamSessionService(assessmentRepo, gradingEngine);
            var analyticsService = new AnalyticsService(assessmentRepo, sessionService);

            string hostPrefix;
            string portEnv = Environment.GetEnvironmentVariable("PORT");

            if (args.Length > 0 && !string.IsNullOrWhiteSpace(args[0]))
            {
                hostPrefix = args[0];
            }
            else if (!string.IsNullOrWhiteSpace(portEnv))
            {
                hostPrefix = $"http://*:{portEnv}/";
            }
            else if (Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true")
            {
                hostPrefix = "http://*:5000/";
            }
            else
            {
                hostPrefix = "http://localhost:5000/";
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
