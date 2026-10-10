using System;
using System.IO;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using JanisonAssessment.Backend.Models;
using JanisonAssessment.Backend.Services;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace JanisonAssessment.Backend.HttpServer
{
    public class JanisonHttpServer
    {
        private readonly HttpListener _listener;
        private readonly IAssessmentRepository _assessmentRepo;
        private readonly IExamSessionService _sessionService;
        private readonly IAnalyticsService _analyticsService;
        private readonly string _prefix;
        private bool _isRunning;

        private static readonly JsonSerializerSettings JsonSettings = new JsonSerializerSettings
        {
            ContractResolver = new CamelCasePropertyNamesContractResolver(),
            Formatting = Formatting.Indented,
            NullValueHandling = NullValueHandling.Ignore
        };

        public JanisonHttpServer(
            string prefix,
            IAssessmentRepository assessmentRepo,
            IExamSessionService sessionService,
            IAnalyticsService analyticsService)
        {
            _prefix = prefix;
            _assessmentRepo = assessmentRepo;
            _sessionService = sessionService;
            _analyticsService = analyticsService;

            _listener = new HttpListener();
            _listener.Prefixes.Add(_prefix);
        }

        public void Start()
        {
            try
            {
                _listener.Start();
                _isRunning = true;
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"[Janison Backend] Self-Hosted API active on {_prefix}");
                Console.ResetColor();

                Task.Run(ListenLoop);
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"[Error starting HttpListener] {ex.Message}");
                Console.ResetColor();
            }
        }

        public void Stop()
        {
            _isRunning = false;
            try
            {
                _listener.Stop();
                _listener.Close();
            }
            catch { }
        }

        private async Task ListenLoop()
        {
            while (_isRunning && _listener.IsListening)
            {
                try
                {
                    var context = await _listener.GetContextAsync();
                    _ = Task.Run(() => HandleRequest(context));
                }
                catch (HttpListenerException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Listener Error] {ex.Message}");
                }
            }
        }

        private async Task HandleRequest(HttpListenerContext context)
        {
            var req = context.Request;
            var res = context.Response;

            // CORS headers for Angular SPA development & production
            res.Headers.Add("Access-Control-Allow-Origin", "*");
            res.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

            if (req.HttpMethod.Equals("OPTIONS", StringComparison.OrdinalIgnoreCase))
            {
                res.StatusCode = (int)HttpStatusCode.NoContent;
                res.Close();
                return;
            }

            string path = req.Url.AbsolutePath.TrimEnd('/');
            string method = req.HttpMethod.ToUpperInvariant();

            try
            {
                // Health Check
                if (method == "GET" && (path == "/api/health" || path == "/health"))
                {
                    await WriteJsonResponse(res, new
                    {
                        status = "Healthy",
                        service = "Janison Assessment Platform API",
                        platform = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription,
                        runtime = Environment.Version.ToString(),
                        timestamp = DateTime.UtcNow
                    });
                    return;
                }

                // GET /api/assessments
                if (method == "GET" && path == "/api/assessments")
                {
                    var all = _assessmentRepo.GetAllAssessments();
                    await WriteJsonResponse(res, all);
                    return;
                }

                // GET /api/assessments/{id}
                var matchAssessId = Regex.Match(path, @"^/api/assessments/([^/]+)$");
                if (method == "GET" && matchAssessId.Success)
                {
                    string id = matchAssessId.Groups[1].Value;
                    var item = _assessmentRepo.GetAssessmentById(id);
                    if (item == null)
                    {
                        res.StatusCode = (int)HttpStatusCode.NotFound;
                        await WriteJsonResponse(res, new { error = "Assessment not found" });
                    }
                    else
                    {
                        await WriteJsonResponse(res, item);
                    }
                    return;
                }

                // POST /api/assessments
                if (method == "POST" && path == "/api/assessments")
                {
                    string body = await ReadBodyAsync(req);
                    var assessment = JsonConvert.DeserializeObject<Assessment>(body);
                    var created = _assessmentRepo.CreateAssessment(assessment);
                    res.StatusCode = (int)HttpStatusCode.Created;
                    await WriteJsonResponse(res, created);
                    return;
                }

                // POST /api/assessments/{id}/questions
                var matchAddQ = Regex.Match(path, @"^/api/assessments/([^/]+)/questions$");
                if (method == "POST" && matchAddQ.Success)
                {
                    string id = matchAddQ.Groups[1].Value;
                    string body = await ReadBodyAsync(req);
                    var q = JsonConvert.DeserializeObject<QuestionItem>(body);
                    var added = _assessmentRepo.AddQuestion(id, q);
                    if (added == null)
                    {
                        res.StatusCode = (int)HttpStatusCode.NotFound;
                        await WriteJsonResponse(res, new { error = "Assessment not found" });
                    }
                    else
                    {
                        res.StatusCode = (int)HttpStatusCode.Created;
                        await WriteJsonResponse(res, added);
                    }
                    return;
                }

                // POST /api/sessions/start
                if (method == "POST" && path == "/api/sessions/start")
                {
                    string body = await ReadBodyAsync(req);
                    var startReq = JsonConvert.DeserializeObject<StartSessionRequest>(body);
                    var session = _sessionService.StartSession(startReq);
                    res.StatusCode = (int)HttpStatusCode.Created;
                    await WriteJsonResponse(res, session);
                    return;
                }

                // GET /api/sessions
                if (method == "GET" && path == "/api/sessions")
                {
                    var sessions = _sessionService.GetAllSessions();
                    await WriteJsonResponse(res, sessions);
                    return;
                }

                // GET /api/sessions/{id}
                var matchSessionId = Regex.Match(path, @"^/api/sessions/([^/]+)$");
                if (method == "GET" && matchSessionId.Success)
                {
                    string id = matchSessionId.Groups[1].Value;
                    var session = _sessionService.GetSession(id);
                    if (session == null)
                    {
                        res.StatusCode = (int)HttpStatusCode.NotFound;
                        await WriteJsonResponse(res, new { error = "Session not found" });
                    }
                    else
                    {
                        await WriteJsonResponse(res, session);
                    }
                    return;
                }

                // POST /api/sessions/{id}/answer
                var matchSaveAns = Regex.Match(path, @"^/api/sessions/([^/]+)/answer$");
                if (method == "POST" && matchSaveAns.Success)
                {
                    string id = matchSaveAns.Groups[1].Value;
                    string body = await ReadBodyAsync(req);
                    var ansReq = JsonConvert.DeserializeObject<SaveAnswerRequest>(body);
                    var updated = _sessionService.SaveAnswer(id, ansReq);
                    if (updated == null)
                    {
                        res.StatusCode = (int)HttpStatusCode.NotFound;
                        await WriteJsonResponse(res, new { error = "Session not found" });
                    }
                    else
                    {
                        await WriteJsonResponse(res, updated);
                    }
                    return;
                }

                // POST /api/sessions/{id}/proctoring
                var matchProctor = Regex.Match(path, @"^/api/sessions/([^/]+)/proctoring$");
                if (method == "POST" && matchProctor.Success)
                {
                    string id = matchProctor.Groups[1].Value;
                    string body = await ReadBodyAsync(req);
                    var proctorReq = JsonConvert.DeserializeObject<ProctoringEventRequest>(body);
                    var updated = _sessionService.LogProctoringEvent(id, proctorReq);
                    if (updated == null)
                    {
                        res.StatusCode = (int)HttpStatusCode.NotFound;
                        await WriteJsonResponse(res, new { error = "Session not found" });
                    }
                    else
                    {
                        await WriteJsonResponse(res, updated);
                    }
                    return;
                }

                // POST /api/sessions/{id}/submit
                var matchSubmit = Regex.Match(path, @"^/api/sessions/([^/]+)/submit$");
                if (method == "POST" && matchSubmit.Success)
                {
                    string id = matchSubmit.Groups[1].Value;
                    var submitted = _sessionService.SubmitExam(id);
                    if (submitted == null)
                    {
                        res.StatusCode = (int)HttpStatusCode.NotFound;
                        await WriteJsonResponse(res, new { error = "Session not found" });
                    }
                    else
                    {
                        await WriteJsonResponse(res, submitted);
                    }
                    return;
                }

                // POST /api/sessions/{id}/grade
                var matchGrade = Regex.Match(path, @"^/api/sessions/([^/]+)/grade$");
                if (method == "POST" && matchGrade.Success)
                {
                    string id = matchGrade.Groups[1].Value;
                    string body = await ReadBodyAsync(req);
                    var gradeReq = JsonConvert.DeserializeObject<ManualGradeRequest>(body);
                    var graded = _sessionService.ManualGrade(id, gradeReq);
                    if (graded == null)
                    {
                        res.StatusCode = (int)HttpStatusCode.NotFound;
                        await WriteJsonResponse(res, new { error = "Session not found" });
                    }
                    else
                    {
                        await WriteJsonResponse(res, graded);
                    }
                    return;
                }

                // GET /api/analytics
                if (method == "GET" && path == "/api/analytics")
                {
                    string assessmentId = req.QueryString["assessmentId"];
                    var summary = _analyticsService.GetSummary(assessmentId);
                    await WriteJsonResponse(res, summary);
                    return;
                }

                // Static Angular SPA File Serving
                if (method == "GET" && !path.StartsWith("/api"))
                {
                    await ServeStaticFile(res, path);
                    return;
                }

                // Fallthrough 404
                res.StatusCode = (int)HttpStatusCode.NotFound;
                await WriteJsonResponse(res, new { error = $"Endpoint not found: {method} {path}" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Request Exception] {ex}");
                res.StatusCode = (int)HttpStatusCode.InternalServerError;
                await WriteJsonResponse(res, new { error = ex.Message });
            }
        }

        private async Task ServeStaticFile(HttpListenerResponse res, string urlPath)
        {
            string distDir = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..\..\..\frontend\dist\frontend\browser"));
            if (!Directory.Exists(distDir))
            {
                distDir = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), @"frontend\dist\frontend\browser"));
            }

            string relPath = urlPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            if (string.IsNullOrEmpty(relPath)) relPath = "index.html";

            string fullPath = Path.Combine(distDir, relPath);
            if (!File.Exists(fullPath))
            {
                fullPath = Path.Combine(distDir, "index.html");
            }

            if (File.Exists(fullPath))
            {
                string ext = Path.GetExtension(fullPath).ToLowerInvariant();
                string contentType = "application/octet-stream";
                if (ext == ".html") contentType = "text/html; charset=utf-8";
                else if (ext == ".js") contentType = "application/javascript; charset=utf-8";
                else if (ext == ".css") contentType = "text/css; charset=utf-8";
                else if (ext == ".ico") contentType = "image/x-icon";
                else if (ext == ".json") contentType = "application/json; charset=utf-8";
                else if (ext == ".svg") contentType = "image/svg+xml";

                res.ContentType = contentType;
                byte[] bytes = File.ReadAllBytes(fullPath);
                res.ContentLength64 = bytes.Length;
                await res.OutputStream.WriteAsync(bytes, 0, bytes.Length);
                res.Close();
            }
            else
            {
                res.StatusCode = (int)HttpStatusCode.NotFound;
                await WriteJsonResponse(res, new { error = "Frontend SPA bundle not found. Run npm run build in frontend." });
            }
        }

        private async Task<string> ReadBodyAsync(HttpListenerRequest request)
        {
            using (var reader = new StreamReader(request.InputStream, request.ContentEncoding ?? Encoding.UTF8))
            {
                return await reader.ReadToEndAsync();
            }
        }

        private async Task WriteJsonResponse(HttpListenerResponse response, object payload)
        {
            response.ContentType = "application/json; charset=utf-8";
            string json = JsonConvert.SerializeObject(payload, JsonSettings);
            byte[] bytes = Encoding.UTF8.GetBytes(json);
            response.ContentLength64 = bytes.Length;
            await response.OutputStream.WriteAsync(bytes, 0, bytes.Length);
            response.Close();
        }
    }
}
