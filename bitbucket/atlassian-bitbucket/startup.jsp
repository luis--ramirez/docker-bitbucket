<%@ page import="com.atlassian.bitbucket.Product" %>
<%@ page import="com.atlassian.bitbucket.util.Progress" %>
<%@ page import="com.atlassian.stash.internal.lifecycle.StartupUtils" %>
<%@ page import="com.atlassian.stash.internal.lifecycle.StartupManager" %>
<!DOCTYPE html>
<html>
<%
    ServletContext servletContext = pageContext.getServletContext();
    StartupManager startupManager = StartupUtils.getStartupManager(servletContext);
    Progress progress = startupManager.getProgress();
%>
<head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=EDGE">
    <title><%= Product.FULL_NAME %> - Starting</title>
    <style>
        * {
            box-sizing: border-box;
        }

        body {
            background-color: #F0F0F0;
            color: #666666;
            text-align: center;
            margin-top: 90px;
            font-family: sans-serif;
            font-size: 18px;
            line-height: 1.3;
        }

        h1 {
            color: #333333;
            font-weight:normal;
            font-size: 32px;
            margin: 0;
        }

        .bitbucket-logo {
            width: 63px;
            height: 100px;
            margin: 0 auto 30px;
            overflow: hidden;
        }

        .header {
            border-bottom: 2px solid #e9e9e9;
            padding: 0 0 30px;
            margin: 0 0 30px;
        }

        .message {
            font-size: 20px;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            white-space: nowrap;
            text-align: left;
        }

        .section {
            width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 30px 40px;
            text-align: center;
        }

        .progress-bar {
            width: 100%;
            background-color: #e9e9e9;
            height: 6px;
            border-radius: 3px;
            overflow: hidden;
            margin: 0 0 20px;
            position: relative;
        }

        .progress-indicator {
            display: block;
            background-color: #3b7fc4;
            height: 100%;
            color: #fff;
            transition:width 0.2s ease-in-out;
        }

        .progress-indicator.unknown {
            width: 100%;
            -webkit-animation: progressSlide 1s infinite linear;
            animation: progressSlide 1s infinite linear;
            background: 0 0;
            background-color: transparent;
            background-size: 20px 5px;
            background-image: linear-gradient(90deg, #ccc 50%, transparent 50%, transparent 100%);
            border-radius: 3px;
            display: block;
            height: 5px;
            -webkit-transform: skewX(45deg);
            transform: skewX(45deg);
            position: absolute;
            width: 100%
        }
        @-webkit-keyframes progressSlide {
            0% { background-position: 20px }
            100% { background-position: 0 }
        }

        @keyframes progressSlide {
            0% { background-position: 20px }
            100% { background-position: 0 }
        }

        footer {
            width: 600px;
            margin: 30px auto;
        }

        footer .logo {
            display: block;
            height: 24px; /* match image height */
            margin: 30px auto;
            text-align: left;
            text-indent: -9999em;
            width: 114px; /* match image width */
            background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTE0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMTE0IDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnIGZpbGw9IiM3MDcwNzAiPjxnPjxwYXRoIGQ9Ik0yNy4yMDYuMjY1Yy0uMTEyLS4xNTQtLjI5Mi0uMjQ3LS40OC0uMjQ3LS4wOTcgMC0uMTkyLjAyNS0uMjc2LjA3Mi0zLjUxNyAxLjk3Ni03LjU5NCAzLjAyLTExLjc5IDMuMDIyLTQuMTk2IDAtOC4yNzItMS4wNDYtMTEuNzktMy4wMi0uMDgzLS4wNS0uMTc4LS4wNzQtLjI3NS0uMDc0LS4xODggMC0uMzY4LjA5My0uNDguMjQ3LS4xNjYuMjI3LS4xNy42MDguMTEyLjgzNSAxLjc2IDEuMzQ4IDMuNzAzIDIuNCA1Ljc3IDMuMTIgMi4xNDQuNzQ2IDQuMzg2IDEuMTI1IDYuNjYzIDEuMTI2IDIuMjc4IDAgNC41Mi0uMzggNi42NjMtMS4xMjYgMi4wNjgtLjcyIDQuMDEtMS43NzIgNS43NzMtMy4xMi4yOC0uMjI3LjI3Ni0uNjA4LjExLS44MzUiLz48cGF0aCBkPSJNMTQuNjYzIDcuMzM2Yy45IDAgMS40Mi0uMDU1IDEuNjA0LS4wNTUuMjIyIDAgLjQzNC4xODguNDM0LjQ1IDAgLjA3NS0uMDE2LjEzLS4wMzQuMTc4LS4xMi4zMjctLjY2MyAxLjUwNC0xLjY3NCAyLjUxNC0uMTE0LjExMy0uMjQyLjEzNS0uMzMuMTM1aC0uMDAyYy0uMDg4IDAtLjIxNy0uMDIyLS4zMy0uMTM1LTEuMDEyLTEuMDEtMS41NTYtMi4xODctMS42NzUtMi41MTQtLjAxOC0uMDQ4LS4wMzUtLjEwMy0uMDM1LS4xOCAwLS4yNi4yMTItLjQ0Ny40MzQtLjQ0Ny4xODMgMCAuNzA1LjA1NiAxLjYwMy4wNTZoLjAwNiIvPjxwYXRoIGQ9Ik0yMy4xNjQgNS44OTRjLS4wODQtLjA2Ni0uMTg0LS4xLS4yODYtLjEtLjA1NyAwLS4xMTQuMDEtLjE3LjAzMi0xLjAxOC40LTIuMDUzLjcwNC0yLjk5OC45My0uMTkyLjA0Ni0uMzQ4LjE5My0uNDEzLjM3LS42ODggMS45MzUtMi40NDYgMy43NzctNC4yOSA1LjcwOC0uMDc0LjA3Mi0uMTc4LjE2Ny0uMzQ2LjE2Ny0uMTY4IDAtLjI3LS4wOS0uMzQ2LS4xNjYtMS44NDQtMS45My0zLjYtMy43NjctNC4yOS01LjcwMi0uMDY0LS4xNzYtLjIyLS4zMjMtLjQxMy0uMzctLjk0NC0uMjI1LTEuOTgyLS41NC0zLS45NC0uMDU0LS4wMi0uMTEtLjAzLS4xNjgtLjAzLS4xMDIgMC0uMi4wMzItLjI4NS4wOTgtLjEzLjEwMi0uMTk4LjI2OC0uMTgzLjQyNy4xNTYgMS42MS43NzYgMy4xODMgMS44OTQgNC44MyAxLjA1IDEuNTUgMi40MjIgMi45ODYgMy43NDcgNC4zNzMgMi40NDMgMi41NTcgNC43NSA0Ljk3MiA0Ljk1MiA3Ljc3Mi4wMTguMjUyLjIyMy40NDguNDcuNDQ4aDIuODdjLjEzIDAgLjI1Mi0uMDU1LjM0Mi0uMTUuMDg3LS4wOTcuMTM0LS4yMjYuMTI4LS4zNTgtLjA5LTEuODcyLS43NzctMy43NDctMi4wOTgtNS43My0uMjc3LS40MTctLjU3NC0uODIyLS44ODQtMS4yMTgtLjEyNi0uMTYtLjA3NC0uMzYuMDIzLS40NjJsLjI4Ni0uMzAyYzEuMzI2LTEuMzg3IDIuNjk2LTIuODIyIDMuNzQ4LTQuMzcyIDEuMTE4LTEuNjQ4IDEuNzM3LTMuMjEyIDEuODkzLTQuODIuMDE2LS4xNjMtLjA1Ni0uMzM1LS4xODMtLjQzNCIvPjxwYXRoIGQ9Ik0xMS41ODIgMTcuNjk4Yy0uMDY4LS4wNzItLjE2OC0uMTQ3LS4zMzUtLjE0Ny0uMjE0IDAtLjM0LjE1My0uMzkuMjI4LTEuMjA2IDEuODg1LTEuODMgMy42NjQtMS45MTYgNS40NTItLjAwNS4xMzIuMDQyLjI2My4xMy4zNi4wOS4wOTUuMjE1LjE1LjM0NC4xNWgyLjg2NWMuMjQ1IDAgLjQ1My0uMTk4LjQ3LS40NS4wNjMtLjg2Mi4zMjUtMS43MjYuOC0yLjYzMy4xNjUtLjMxNC4wMzctLjYxLS4wNTgtLjczNS0uNDcyLS42My0xLjA1LTEuMzAyLTEuOTEtMi4yMjQiLz48L2c+PGc+PHBhdGggZD0iTTM0LjA3IDYuNDU3Yy0uMDU3LS4xODYtLjIyNS0uMzEzLS40MTUtLjMxM2gtNC4wNjhjLS4xOSAwLS4zNTguMTI3LS40MTUuMzEzTDI0LjA0IDIzLjE2Yy0uMDQuMTM2LS4wMTguMjg0LjA2NS40LjA4Mi4xMTQuMjEyLjE4Mi4zNS4xODJoMi44Yy4xOTQgMCAuMzY0LS4xMy40Mi0uMzJsMy41MzMtMTIuMjg1cy4wOTItLjMwNy40MTItLjMwN2MuMzI2IDAgLjQwNS4zMi40MDUuMzJsMS42NCA1LjgyNEgzMS40NmMtLjE5NSAwLS4zNjcuMTMzLS40Mi4zMjZsLS42MzIgMi4zMDdjLS4wMzcuMTM1LS4wMS4yOC4wNzMuMzkuMDgyLjExMi4yMS4xNzguMzQ3LjE3OGgzLjc1bC45OSAzLjI1M2MuMDU1LjE4Ni4yMjQuMzE0LjQxNS4zMTRoMi44Yy4xNCAwIC4yNy0uMDY4LjM1My0uMTgzLjA4Mi0uMTE2LjEwNS0uMjY0LjA2NC0uNEwzNC4wNyA2LjQ1NyIvPjxwYXRoIGQ9Ik00Ni4yNyAyMS4xNjhjLS4wMi0uMTI1LS4wODctLjIzNi0uMTktLjMwNi0uMTAyLS4wNy0uMjI3LS4wOTItLjM0Ny0uMDYyLS40NTQuMTE2LS44OS4xOC0xLjIyNi4xOC0uNjM3IDAtLjkyLS4yODMtLjkyLS45MnYtNi40aDIuNWMuMjQgMCAuNDM1LS4yLjQzNS0uNDQ2di0xLjk5NmMwLS4yNDctLjE5NS0uNDQ3LS40MzYtLjQ0N2gtMi41VjcuNjljMC0uMTMtLjA1NS0uMjUzLS4xNS0uMzM4LS4wOTUtLjA4NS0uMjIyLS4xMjQtLjM0Ni0uMTA2bC0yLjU3NC4zNjhjLS4yMTYuMDMtLjM3Ni4yMi0uMzc2LjQ0M3YyLjcxNGgtMS40MDJjLS4yNCAwLS40MzYuMi0uNDM2LjQ0OHYxLjk5NmMwIC4yNDcuMTk1LjQ0Ny40MzYuNDQ3aDEuNDAydjYuODE0YzAgMi4zNCAxLjE5OCAzLjUyNiAzLjU2IDMuNTI2LjY3NCAwIDEuODE2LS4xNiAyLjU2My0uNDI1LjE5OC0uMDcuMzItLjI3Ny4yODgtLjQ5bC0uMjgtMS45MTciLz48cGF0aCBkPSJNNTEuMDM2IDUuODE4SDQ4LjQ2Yy0uMjQgMC0uNDM1LjItLjQzNS40NDh2MTcuMDI4YzAgLjI0OC4xOTYuNDQ4LjQzNi40NDhoMi41NzZjLjI0IDAgLjQzNS0uMi40MzUtLjQ0OFY2LjI2NmMwLS4yNDgtLjE5NC0uNDQ4LS40MzQtLjQ0OCIvPjxwYXRoIGQ9Ik01OS4zODMgMTguOTg2djEuNTU2Yy0uNDI3LjIzMy0xLjIuNTY4LTIuMTMuNTY4LS44MDMgMC0xLjA0Ny0uMjUtMS4wNDctMS4wNzUgMC0uOC4xNS0xLjA1IDEuMDk3LTEuMDVoMi4wOHptLTEuNzI4LTguNDc0Yy0xLjMwMyAwLTIuODkuMjEtNC4wNC41MzgtLjIxNS4wNi0uMzUuMjc3LS4zMTQuNTAybC4zMDIgMS45MThjLjAyLjEyLjA4NC4yMjYuMTguMjk2LjA5Ny4wNy4yMTcuMDk1LjMzNC4wNzIgMS4wNy0uMjE0IDIuMTc1LS4zMzIgMy4xMS0uMzMyIDEuODYgMCAyLjE1Ny40MDMgMi4xNTcgMS42OTV2MS4xMjhoLTIuNzZjLTIuNjM3IDAtMy43NjMgMS4xMTYtMy43NjMgMy43MzMgMCAyLjUwNCAxLjIzNCAzLjk0IDMuMzg1IDMuOTQgMS4yNDUgMCAyLjQ5LS4zNTQgMy41MzgtMS4wMDNsLjExLjQxNWMuMDUyLjE5NS4yMjQuMzMuNDIuMzNoMi4wOGMuMjQgMCAuNDM2LS4yLjQzNi0uNDQ4di04LjA0YzAtMy40NTctMS40MDMtNC43NDItNS4xNzUtNC43NDJ6Ii8+PHBhdGggZD0iTTY5LjI4IDE1LjcxNGMtMS41OTgtLjQyMy0xLjU5OC0uNDQtMS41OTgtMS4zNCAwLS42MDQuMDYtLjg5NCAxLjM3NS0uODk0LjkwMiAwIDIuMjMyLjE2MiAzLjA4Ni4zMTIuMTE4LjAyLjIzOC0uMDEuMzM0LS4wODIuMDk1LS4wNzMuMTU4LS4xODMuMTcyLS4zMDRsLjI0Mi0yLjAxNGMuMDI3LS4yMjctLjExNi0uNDQtLjMzNC0uNDktLjk4OC0uMjM3LTIuMzYyLS4zOS0zLjUtLjM5LTMuOTYgMC00Ljc3IDEuNTM0LTQuNzcgMy44MzYgMCAyLjUzMi40NTcgMy4zODMgMy40OSA0LjE0IDIgLjQ5NSAyIC44NiAyIDEuNDcgMCAuNzk4LS4wNjggMS4wNzQtMS4zNzYgMS4wNzQtMS4wNTMgMC0yLjI3LS4xNjgtMy4zNDMtLjQ2Mi0uMTItLjAzMi0uMjQ0LS4wMTItLjM0Ny4wNTUtLjEwMy4wNjYtLjE3My4xNzQtLjE5NS4yOTdsLS4zNCAxLjkxYy0uMDQuMjIyLjA4Ni40MzguMjk0LjUwNyAxLjE3LjM4OCAyLjg0Ny42NiA0LjA4LjY2IDMuODM1IDAgNC42Mi0xLjY0NyA0LjYyLTQuMTIgMC0yLjczLS40NzItMy4yMzctMy44OTItNC4xNjYiLz48cGF0aCBkPSJNNzkuMjI3IDE1LjcxNGMtMS41OTctLjQyMy0xLjU5Ny0uNDQtMS41OTctMS4zNCAwLS42MDQuMDU4LS44OTQgMS4zNzQtLjg5NC45MDIgMCAyLjIzMi4xNjIgMy4wODcuMzEyLjExOC4wMi4yNC0uMDEuMzM0LS4wODIuMDk2LS4wNzMuMTU4LS4xODMuMTczLS4zMDRsLjI0Mi0yLjAxNGMuMDI3LS4yMjctLjExNy0uNDQtLjMzNC0uNDktLjk4OC0uMjM3LTIuMzYzLS4zOS0zLjUwMi0uMzktMy45NiAwLTQuNzcgMS41MzQtNC43NyAzLjgzNiAwIDIuNTMyLjQ1OCAzLjM4MyAzLjQ5MyA0LjE0IDEuOTk3LjQ5NSAxLjk5Ny44NiAxLjk5NyAxLjQ3IDAgLjc5OC0uMDY2IDEuMDc0LTEuMzc0IDEuMDc0LTEuMDUzIDAtMi4yNzItLjE2OC0zLjM0NC0uNDYyLS4xMTctLjAzMi0uMjQzLS4wMTItLjM0NS4wNTUtLjEwMi4wNjYtLjE3My4xNzQtLjE5NS4yOTdsLS4zNCAxLjkxYy0uMDQuMjIyLjA4Ni40MzguMjk0LjUwNyAxLjE2OC4zODggMi44NDcuNjYgNC4wOC42NiAzLjgzNCAwIDQuNjItMS42NDcgNC42Mi00LjEyIDAtMi43My0uNDczLTMuMjM3LTMuODkzLTQuMTY2Ii8+PHBhdGggZD0iTTg3LjU2IDUuODE4aC0yLjU3NmMtLjI0IDAtLjQzNi4yLS40MzYuNDQ3VjguNmMwIC4yNDguMTk2LjQ0OC40MzYuNDQ4aDIuNTc1Yy4yNCAwIC40MzUtLjIuNDM1LS40NDdWNi4yNjZjMC0uMjQ3LS4xOTYtLjQ0Ny0uNDM2LS40NDciLz48cGF0aCBkPSJNODcuNTYgMTAuNzdoLTIuNTc2Yy0uMjQgMC0uNDM2LjItLjQzNi40NDh2MTIuMDc2YzAgLjI0OC4xOTYuNDQ4LjQzNi40NDhoMi41NzVjLjI0IDAgLjQzNS0uMi40MzUtLjQ0OFYxMS4yMThjMC0uMjQ3LS4xOTYtLjQ0Ny0uNDM2LS40NDciLz48cGF0aCBkPSJNOTUuOTcgMTguOTg2djEuNTU2Yy0uNDI2LjIzMy0xLjIuNTY4LTIuMTMuNTY4LS44MDIgMC0xLjA0Ny0uMjUtMS4wNDctMS4wNzUgMC0uOC4xNTItMS4wNSAxLjA5OC0xLjA1aDIuMDh6bS0xLjcyNy04LjQ3NGMtMS4zMDMgMC0yLjg5LjIxLTQuMDQuNTM4LS4yMTUuMDYtLjM1LjI3Ny0uMzE1LjUwMmwuMzAyIDEuOTE4Yy4wMi4xMi4wODQuMjI2LjE4LjI5Ni4wOTcuMDcuMjE3LjA5NS4zMzMuMDcyIDEuMDctLjIxNCAyLjE3Ni0uMzMyIDMuMTEyLS4zMzIgMS44NTggMCAyLjE1NS40MDMgMi4xNTUgMS42OTV2MS4xMjhoLTIuNzZjLTIuNjM3IDAtMy43NjIgMS4xMTYtMy43NjIgMy43MzMgMCAyLjUwNCAxLjIzNCAzLjk0IDMuMzg1IDMuOTQgMS4yNDQgMCAyLjQ5LS4zNTQgMy41MzgtMS4wMDNsLjExLjQxNWMuMDUzLjE5NS4yMjUuMzMuNDIuMzNoMi4wOGMuMjQgMCAuNDM3LS4yLjQzNy0uNDQ4di04LjA0YzAtMy40NTctMS40MDMtNC43NDItNS4xNzQtNC43NDJ6Ii8+PHBhdGggZD0iTTEwOC45MzggMTAuNTEyYy0xLjM2NCAwLTMuMjIzLjQ4My00Ljc5MyAxLjI0bC0uMTg4LS42NmMtLjA1NC0uMTktLjIyNS0uMzItLjQxOC0uMzJoLTEuOTA4Yy0uMjQgMC0uNDM2LjItLjQzNi40NDZ2MTIuMDc2YzAgLjI0OC4xOTYuNDQ4LjQzNi40NDhoMi41NzVjLjI0IDAgLjQzNi0uMi40MzYtLjQ0OFYxNC45M2MuOTI3LS40ODQgMi4yMy0uOTg0IDMuMDEtLjk4NC41OCAwIC43OTYuMjIuNzk2LjgxNnY4LjUzMmMwIC4yNDguMTk1LjQ0OC40MzUuNDQ4aDIuNTc1Yy4yNCAwIC40MzUtLjIuNDM1LS40NDh2LTguODY4YzAtMi41OTctLjk5NC0zLjkxNC0yLjk1Ny0zLjkxNCIvPjwvZz48L2c+PC9zdmc+) center bottom no-repeat;
            background-size: 114px 24px;
        }

        footer .logo:hover,
        footer .logo:active,
        footer .logo:focus {
            background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTE0IiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMTE0IDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnPjxnIGZpbGw9IiM1QkE1Q0UiPjxwYXRoIGQ9Ik0yNy4yMDYuMjY1Yy0uMTEyLS4xNTQtLjI5Mi0uMjQ3LS40OC0uMjQ3LS4wOTcgMC0uMTkyLjAyNS0uMjc2LjA3Mi0zLjUxNyAxLjk3Ni03LjU5NCAzLjAyLTExLjc5IDMuMDIyLTQuMTk2IDAtOC4yNzItMS4wNDYtMTEuNzktMy4wMi0uMDgzLS4wNS0uMTc4LS4wNzQtLjI3NS0uMDc0LS4xODggMC0uMzY4LjA5My0uNDguMjQ3LS4xNjYuMjI3LS4xNy42MDguMTEyLjgzNSAxLjc2IDEuMzQ4IDMuNzAzIDIuNCA1Ljc3IDMuMTIgMi4xNDQuNzQ2IDQuMzg2IDEuMTI1IDYuNjYzIDEuMTI2IDIuMjc4IDAgNC41Mi0uMzggNi42NjMtMS4xMjYgMi4wNjgtLjcyIDQuMDEtMS43NzIgNS43NzMtMy4xMi4yOC0uMjI3LjI3Ni0uNjA4LjExLS44MzUiLz48cGF0aCBkPSJNMTQuNjYzIDcuMzM2Yy45IDAgMS40Mi0uMDU1IDEuNjA0LS4wNTUuMjIyIDAgLjQzNC4xODguNDM0LjQ1IDAgLjA3NS0uMDE2LjEzLS4wMzQuMTc4LS4xMi4zMjctLjY2MyAxLjUwNC0xLjY3NCAyLjUxNC0uMTE0LjExMy0uMjQyLjEzNS0uMzMuMTM1aC0uMDAyYy0uMDg4IDAtLjIxNy0uMDIyLS4zMy0uMTM1LTEuMDEyLTEuMDEtMS41NTYtMi4xODctMS42NzUtMi41MTQtLjAxOC0uMDQ4LS4wMzUtLjEwMy0uMDM1LS4xOCAwLS4yNi4yMTItLjQ0Ny40MzQtLjQ0Ny4xODMgMCAuNzA1LjA1NiAxLjYwMy4wNTZoLjAwNiIvPjxwYXRoIGQ9Ik0yMy4xNjQgNS44OTRjLS4wODQtLjA2Ni0uMTg0LS4xLS4yODYtLjEtLjA1NyAwLS4xMTQuMDEtLjE3LjAzMi0xLjAxOC40LTIuMDUzLjcwNC0yLjk5OC45My0uMTkyLjA0Ni0uMzQ4LjE5My0uNDEzLjM3LS42ODggMS45MzUtMi40NDYgMy43NzctNC4yOSA1LjcwOC0uMDc0LjA3Mi0uMTc4LjE2Ny0uMzQ2LjE2Ny0uMTY4IDAtLjI3LS4wOS0uMzQ2LS4xNjYtMS44NDQtMS45My0zLjYtMy43NjctNC4yOS01LjcwMi0uMDY0LS4xNzYtLjIyLS4zMjMtLjQxMy0uMzctLjk0NC0uMjI1LTEuOTgyLS41NC0zLS45NC0uMDU0LS4wMi0uMTEtLjAzLS4xNjgtLjAzLS4xMDIgMC0uMi4wMzItLjI4NS4wOTgtLjEzLjEwMi0uMTk4LjI2OC0uMTgzLjQyNy4xNTYgMS42MS43NzYgMy4xODMgMS44OTQgNC44MyAxLjA1IDEuNTUgMi40MjIgMi45ODYgMy43NDcgNC4zNzMgMi40NDMgMi41NTcgNC43NSA0Ljk3MiA0Ljk1MiA3Ljc3Mi4wMTguMjUyLjIyMy40NDguNDcuNDQ4aDIuODdjLjEzIDAgLjI1Mi0uMDU1LjM0Mi0uMTUuMDg3LS4wOTcuMTM0LS4yMjYuMTI4LS4zNTgtLjA5LTEuODcyLS43NzctMy43NDctMi4wOTgtNS43My0uMjc3LS40MTctLjU3NC0uODIyLS44ODQtMS4yMTgtLjEyNi0uMTYtLjA3NC0uMzYuMDIzLS40NjJsLjI4Ni0uMzAyYzEuMzI2LTEuMzg3IDIuNjk2LTIuODIyIDMuNzQ4LTQuMzcyIDEuMTE4LTEuNjQ4IDEuNzM3LTMuMjEyIDEuODkzLTQuODIuMDE2LS4xNjMtLjA1Ni0uMzM1LS4xODMtLjQzNCIvPjxwYXRoIGQ9Ik0xMS41ODIgMTcuNjk4Yy0uMDY4LS4wNzItLjE2OC0uMTQ3LS4zMzUtLjE0Ny0uMjE0IDAtLjM0LjE1My0uMzkuMjI4LTEuMjA2IDEuODg1LTEuODMgMy42NjQtMS45MTYgNS40NTItLjAwNS4xMzIuMDQyLjI2My4xMy4zNi4wOS4wOTUuMjE1LjE1LjM0NC4xNWgyLjg2NWMuMjQ1IDAgLjQ1My0uMTk4LjQ3LS40NS4wNjMtLjg2Mi4zMjUtMS43MjYuOC0yLjYzMy4xNjUtLjMxNC4wMzctLjYxLS4wNTgtLjczNS0uNDcyLS42My0xLjA1LTEuMzAyLTEuOTEtMi4yMjQiLz48L2c+PGcgZmlsbD0iIzI3NDk3MCI+PHBhdGggZD0iTTM0LjA3IDYuNDU3Yy0uMDU3LS4xODYtLjIyNS0uMzEzLS40MTUtLjMxM2gtNC4wNjhjLS4xOSAwLS4zNTguMTI3LS40MTUuMzEzTDI0LjA0IDIzLjE2Yy0uMDQuMTM2LS4wMTguMjg0LjA2NS40LjA4Mi4xMTQuMjEyLjE4Mi4zNS4xODJoMi44Yy4xOTQgMCAuMzY0LS4xMy40Mi0uMzJsMy41MzMtMTIuMjg1cy4wOTItLjMwNy40MTItLjMwN2MuMzI2IDAgLjQwNS4zMi40MDUuMzJsMS42NCA1LjgyNEgzMS40NmMtLjE5NSAwLS4zNjcuMTMzLS40Mi4zMjZsLS42MzIgMi4zMDdjLS4wMzcuMTM1LS4wMS4yOC4wNzMuMzkuMDgyLjExMi4yMS4xNzguMzQ3LjE3OGgzLjc1bC45OSAzLjI1M2MuMDU1LjE4Ni4yMjQuMzE0LjQxNS4zMTRoMi44Yy4xNCAwIC4yNy0uMDY4LjM1My0uMTgzLjA4Mi0uMTE2LjEwNS0uMjY0LjA2NC0uNEwzNC4wNyA2LjQ1NyIvPjxwYXRoIGQ9Ik00Ni4yNyAyMS4xNjhjLS4wMi0uMTI1LS4wODctLjIzNi0uMTktLjMwNi0uMTAyLS4wNy0uMjI3LS4wOTItLjM0Ny0uMDYyLS40NTQuMTE2LS44OS4xOC0xLjIyNi4xOC0uNjM3IDAtLjkyLS4yODMtLjkyLS45MnYtNi40aDIuNWMuMjQgMCAuNDM1LS4yLjQzNS0uNDQ2di0xLjk5NmMwLS4yNDctLjE5NS0uNDQ3LS40MzYtLjQ0N2gtMi41VjcuNjljMC0uMTMtLjA1NS0uMjUzLS4xNS0uMzM4LS4wOTUtLjA4NS0uMjIyLS4xMjQtLjM0Ni0uMTA2bC0yLjU3NC4zNjhjLS4yMTYuMDMtLjM3Ni4yMi0uMzc2LjQ0M3YyLjcxNGgtMS40MDJjLS4yNCAwLS40MzYuMi0uNDM2LjQ0OHYxLjk5NmMwIC4yNDcuMTk1LjQ0Ny40MzYuNDQ3aDEuNDAydjYuODE0YzAgMi4zNCAxLjE5OCAzLjUyNiAzLjU2IDMuNTI2LjY3NCAwIDEuODE2LS4xNiAyLjU2My0uNDI1LjE5OC0uMDcuMzItLjI3Ny4yODgtLjQ5bC0uMjgtMS45MTciLz48cGF0aCBkPSJNNTEuMDM2IDUuODE4SDQ4LjQ2Yy0uMjQgMC0uNDM1LjItLjQzNS40NDh2MTcuMDI4YzAgLjI0OC4xOTYuNDQ4LjQzNi40NDhoMi41NzZjLjI0IDAgLjQzNS0uMi40MzUtLjQ0OFY2LjI2NmMwLS4yNDgtLjE5NC0uNDQ4LS40MzQtLjQ0OCIvPjxwYXRoIGQ9Ik01OS4zODMgMTguOTg2djEuNTU2Yy0uNDI3LjIzMy0xLjIuNTY4LTIuMTMuNTY4LS44MDMgMC0xLjA0Ny0uMjUtMS4wNDctMS4wNzUgMC0uOC4xNS0xLjA1IDEuMDk3LTEuMDVoMi4wOHptLTEuNzI4LTguNDc0Yy0xLjMwMyAwLTIuODkuMjEtNC4wNC41MzgtLjIxNS4wNi0uMzUuMjc3LS4zMTQuNTAybC4zMDIgMS45MThjLjAyLjEyLjA4NC4yMjYuMTguMjk2LjA5Ny4wNy4yMTcuMDk1LjMzNC4wNzIgMS4wNy0uMjE0IDIuMTc1LS4zMzIgMy4xMS0uMzMyIDEuODYgMCAyLjE1Ny40MDMgMi4xNTcgMS42OTV2MS4xMjhoLTIuNzZjLTIuNjM3IDAtMy43NjMgMS4xMTYtMy43NjMgMy43MzMgMCAyLjUwNCAxLjIzNCAzLjk0IDMuMzg1IDMuOTQgMS4yNDUgMCAyLjQ5LS4zNTQgMy41MzgtMS4wMDNsLjExLjQxNWMuMDUyLjE5NS4yMjQuMzMuNDIuMzNoMi4wOGMuMjQgMCAuNDM2LS4yLjQzNi0uNDQ4di04LjA0YzAtMy40NTctMS40MDMtNC43NDItNS4xNzUtNC43NDJ6Ii8+PHBhdGggZD0iTTY5LjI4IDE1LjcxNGMtMS41OTgtLjQyMy0xLjU5OC0uNDQtMS41OTgtMS4zNCAwLS42MDQuMDYtLjg5NCAxLjM3NS0uODk0LjkwMiAwIDIuMjMyLjE2MiAzLjA4Ni4zMTIuMTE4LjAyLjIzOC0uMDEuMzM0LS4wODIuMDk1LS4wNzMuMTU4LS4xODMuMTcyLS4zMDRsLjI0Mi0yLjAxNGMuMDI3LS4yMjctLjExNi0uNDQtLjMzNC0uNDktLjk4OC0uMjM3LTIuMzYyLS4zOS0zLjUtLjM5LTMuOTYgMC00Ljc3IDEuNTM0LTQuNzcgMy44MzYgMCAyLjUzMi40NTcgMy4zODMgMy40OSA0LjE0IDIgLjQ5NSAyIC44NiAyIDEuNDcgMCAuNzk4LS4wNjggMS4wNzQtMS4zNzYgMS4wNzQtMS4wNTMgMC0yLjI3LS4xNjgtMy4zNDMtLjQ2Mi0uMTItLjAzMi0uMjQ0LS4wMTItLjM0Ny4wNTUtLjEwMy4wNjYtLjE3My4xNzQtLjE5NS4yOTdsLS4zNCAxLjkxYy0uMDQuMjIyLjA4Ni40MzguMjk0LjUwNyAxLjE3LjM4OCAyLjg0Ny42NiA0LjA4LjY2IDMuODM1IDAgNC42Mi0xLjY0NyA0LjYyLTQuMTIgMC0yLjczLS40NzItMy4yMzctMy44OTItNC4xNjYiLz48cGF0aCBkPSJNNzkuMjI3IDE1LjcxNGMtMS41OTctLjQyMy0xLjU5Ny0uNDQtMS41OTctMS4zNCAwLS42MDQuMDU4LS44OTQgMS4zNzQtLjg5NC45MDIgMCAyLjIzMi4xNjIgMy4wODcuMzEyLjExOC4wMi4yNC0uMDEuMzM0LS4wODIuMDk2LS4wNzMuMTU4LS4xODMuMTczLS4zMDRsLjI0Mi0yLjAxNGMuMDI3LS4yMjctLjExNy0uNDQtLjMzNC0uNDktLjk4OC0uMjM3LTIuMzYzLS4zOS0zLjUwMi0uMzktMy45NiAwLTQuNzcgMS41MzQtNC43NyAzLjgzNiAwIDIuNTMyLjQ1OCAzLjM4MyAzLjQ5MyA0LjE0IDEuOTk3LjQ5NSAxLjk5Ny44NiAxLjk5NyAxLjQ3IDAgLjc5OC0uMDY2IDEuMDc0LTEuMzc0IDEuMDc0LTEuMDUzIDAtMi4yNzItLjE2OC0zLjM0NC0uNDYyLS4xMTctLjAzMi0uMjQzLS4wMTItLjM0NS4wNTUtLjEwMi4wNjYtLjE3My4xNzQtLjE5NS4yOTdsLS4zNCAxLjkxYy0uMDQuMjIyLjA4Ni40MzguMjk0LjUwNyAxLjE2OC4zODggMi44NDcuNjYgNC4wOC42NiAzLjgzNCAwIDQuNjItMS42NDcgNC42Mi00LjEyIDAtMi43My0uNDczLTMuMjM3LTMuODkzLTQuMTY2Ii8+PHBhdGggZD0iTTg3LjU2IDUuODE4aC0yLjU3NmMtLjI0IDAtLjQzNi4yLS40MzYuNDQ3VjguNmMwIC4yNDguMTk2LjQ0OC40MzYuNDQ4aDIuNTc1Yy4yNCAwIC40MzUtLjIuNDM1LS40NDdWNi4yNjZjMC0uMjQ3LS4xOTYtLjQ0Ny0uNDM2LS40NDciLz48cGF0aCBkPSJNODcuNTYgMTAuNzdoLTIuNTc2Yy0uMjQgMC0uNDM2LjItLjQzNi40NDh2MTIuMDc2YzAgLjI0OC4xOTYuNDQ4LjQzNi40NDhoMi41NzVjLjI0IDAgLjQzNS0uMi40MzUtLjQ0OFYxMS4yMThjMC0uMjQ3LS4xOTYtLjQ0Ny0uNDM2LS40NDciLz48cGF0aCBkPSJNOTUuOTcgMTguOTg2djEuNTU2Yy0uNDI2LjIzMy0xLjIuNTY4LTIuMTMuNTY4LS44MDIgMC0xLjA0Ny0uMjUtMS4wNDctMS4wNzUgMC0uOC4xNTItMS4wNSAxLjA5OC0xLjA1aDIuMDh6bS0xLjcyNy04LjQ3NGMtMS4zMDMgMC0yLjg5LjIxLTQuMDQuNTM4LS4yMTUuMDYtLjM1LjI3Ny0uMzE1LjUwMmwuMzAyIDEuOTE4Yy4wMi4xMi4wODQuMjI2LjE4LjI5Ni4wOTcuMDcuMjE3LjA5NS4zMzMuMDcyIDEuMDctLjIxNCAyLjE3Ni0uMzMyIDMuMTEyLS4zMzIgMS44NTggMCAyLjE1NS40MDMgMi4xNTUgMS42OTV2MS4xMjhoLTIuNzZjLTIuNjM3IDAtMy43NjIgMS4xMTYtMy43NjIgMy43MzMgMCAyLjUwNCAxLjIzNCAzLjk0IDMuMzg1IDMuOTQgMS4yNDQgMCAyLjQ5LS4zNTQgMy41MzgtMS4wMDNsLjExLjQxNWMuMDUzLjE5NS4yMjUuMzMuNDIuMzNoMi4wOGMuMjQgMCAuNDM3LS4yLjQzNy0uNDQ4di04LjA0YzAtMy40NTctMS40MDMtNC43NDItNS4xNzQtNC43NDJ6Ii8+PHBhdGggZD0iTTEwOC45MzggMTAuNTEyYy0xLjM2NCAwLTMuMjIzLjQ4My00Ljc5MyAxLjI0bC0uMTg4LS42NmMtLjA1NC0uMTktLjIyNS0uMzItLjQxOC0uMzJoLTEuOTA4Yy0uMjQgMC0uNDM2LjItLjQzNi40NDZ2MTIuMDc2YzAgLjI0OC4xOTYuNDQ4LjQzNi40NDhoMi41NzVjLjI0IDAgLjQzNi0uMi40MzYtLjQ0OFYxNC45M2MuOTI3LS40ODQgMi4yMy0uOTg0IDMuMDEtLjk4NC41OCAwIC43OTYuMjIuNzk2LjgxNnY4LjUzMmMwIC4yNDguMTk1LjQ0OC40MzUuNDQ4aDIuNTc1Yy4yNCAwIC40MzUtLjIuNDM1LS40NDh2LTguODY4YzAtMi41OTctLjk5NC0zLjkxNC0yLjk1Ny0zLjkxNCIvPjwvZz48L2c+PC9zdmc+);
            background-size: 114px 24px;
        }
    </style>
</head>
<body>
    <div class="section">
        <div class="header">
            <div class="bitbucket-logo">
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 200">
                    <style>
                        .st0{fill:#FFFFFF;}
                        .st1{fill:#205182;}
                        .falling-text {
                            font-size: 24pt;
                            font-family: monospace;
                        }
                    </style>
                    <defs>
                        <text id="text1" x="25" y="-20" class="falling-text st1">1</text>
                        <text id="text0" x="25" y="-20" class="falling-text st1">0</text>
                    </defs>
                    <path class="st1" d="M23.1 77.3c-.2-4.6 18.4-8.7 41-8.7 22.5 0 40.9 4.1 41 8.7h22.7c-3.2-10.2-30.7-18.6-63.7-18.6C31 58.7 3.4 67 .2 77.3h22.9z"/>

                    <use xlink:href="#text1" x="0">
                        <animate attributeName="y"
                                 begin="0"
                                 dur="2s"
                                 fill="freeze"
                                 repeatCount="indefinite"
                                 calcMode="spline"
                                 values="0; 127; 127"
                                 keyTimes="0; 0.7; 1"
                                 keySplines="0.55, 0.055, 0.675, 0.19; 0, 0, 0, 0" />
                        <animate attributeName="opacity"
                                 begin="0"
                                 dur="2s"
                                 values="0; 0; 1; 1"
                                 keyTimes="0; 0.4; 0.6; 1"
                                 repeatCount="indefinite"
                                 fill="freeze" />
                    </use>

                    <use xlink:href="#text0" x="15">
                        <animate attributeName="y"
                                 begin="1s"
                                 dur="1.75s"
                                 fill="freeze"
                                 repeatCount="indefinite"
                                 calcMode="spline"
                                 values="0; 127; 127"
                                 keyTimes="0; 0.7; 1"
                                 keySplines="0.55, 0.055, 0.675, 0.19; 0, 0, 0, 0" />
                        <animate attributeName="opacity"
                                 begin="1s"
                                 dur="1.75s"
                                 values="0; 0; 1; 1"
                                 keyTimes="0; 0.4; 0.6; 1"
                                 repeatCount="indefinite"
                                 fill="freeze" />
                    </use>

                    <use xlink:href="#text1" x="25">
                        <animate attributeName="y"
                                 begin="1.33s"
                                 dur="2s"
                                 fill="freeze"
                                 repeatCount="indefinite"
                                 calcMode="spline"
                                 values="0; 127; 127"
                                 keyTimes="0; 0.7; 1"
                                 keySplines="0.55, 0.055, 0.675, 0.19; 0, 0, 0, 0" />
                        <animate attributeName="opacity"
                                 begin="1.33s"
                                 dur="2s"
                                 values="0; 0; 1; 1"
                                 keyTimes="0; 0.4; 0.6; 1"
                                 repeatCount="indefinite"
                                 fill="freeze" />
                    </use>

                    <use xlink:href="#text0" x="51">
                        <animate attributeName="y"
                                 begin="2.66s"
                                 dur="2s"
                                 fill="freeze"
                                 repeatCount="indefinite"
                                 calcMode="spline"
                                 values="0; 127; 127"
                                 keyTimes="0; 0.7; 1"
                                 keySplines="0.55, 0.055, 0.675, 0.19; 0, 0, 0, 0" />
                        <animate attributeName="opacity"
                                 begin="2.66s"
                                 dur="2s"
                                 values="0; 0; 1; 1"
                                 keyTimes="0; 0.4; 0.6; 1"
                                 repeatCount="indefinite"
                                 fill="freeze" />
                    </use>

                    <use xlink:href="#text1" x="60">
                        <animate attributeName="y"
                                 begin="0.25s"
                                 dur="1.8s"
                                 fill="freeze"
                                 repeatCount="indefinite"
                                 calcMode="spline"
                                 values="0; 127; 127"
                                 keyTimes="0; 0.7; 1"
                                 keySplines="0.55, 0.055, 0.675, 0.19; 0, 0, 0, 0" />
                        <animate attributeName="opacity"
                                 begin="0.25s"
                                 dur="1.8s"
                                 values="0; 0; 1; 1"
                                 keyTimes="0; 0.4; 0.6; 1"
                                 repeatCount="indefinite"
                                 fill="freeze" />
                    </use>

                    <circle class="st0" cx="64" cy="126.9" r="23" />
                    <path class="st1" d="M127.6 77H105c-.1 4.6-18.4 8.3-41 8.3-22.5 0-40.9-3.8-41-8.3H.3c-.2.6-.3 1.3-.3 2 0 3 7.6 45.4 10.8 62.3 1.4 7.6 21.8 18.6 53.3 18.6 31.5 0 51.9-11.1 53.3-18.6C120.4 124.5 128 82 128 79c0-.7-.2-1.4-.4-2zm-63.5 69.3c-11.2 0-20.3-8.7-20.3-19.4s9.1-19.4 20.3-19.4 20.3 8.7 20.3 19.4-9.1 19.4-20.3 19.4z"/>
                    <circle class="st1" cx="64" cy="126.9" r="10" />
                    <path class="st1" d="M110 158.2c-.9 0-1.8.7-1.8.7s-15.8 11.9-44.3 11.9-44.3-11.9-44.3-11.9-.7-.7-1.8-.7c-1.2 0-2.3.7-2.3 2.4v.5c2.4 12.5 4.2 21.4 4.5 22.7C22.2 193 41 200 63.7 200c22.7 0 41.6-6.9 43.6-16.2.3-1.4 2.1-10.2 4.5-22.7v-.5c.5-1.7-.7-2.4-1.8-2.4z"/>
                </svg>
            </div>
            <h1><%= Product.FULL_NAME %> is starting up</h1>
        </div>

        <p class="message"><span id="message"><%= progress.getMessage()%></span></p>

        <div class="progress-bar"><span id="progress" class="progress-indicator" style="width:<%= progress.getPercentage()%>%"></span></div>
    </div>
    <footer>
        <a href="http://www.atlassian.com" target="_blank" class="logo">Atlassian</a>
    </footer>
    <script>
        (function(){
            var contextPath = '<%= servletContext.getContextPath() %>';
            var messageEl = document.querySelector('#message');
            var progressEl = document.querySelector('#progress');

            function setMessage(msg) {
                messageEl.setAttribute('title', msg);
                messageEl.textContent = msg;
            }

            function setProgress(pct) {
                var val = pct != null ? pct + '%' : null;
                progressEl.style.width = val;
            }

            setTimeout(function poll() {
                var request = new XMLHttpRequest();

                request.onload = function() {
                    var serviceUnavailable = request.status === 503;
                    var json;
                    var message = 'Starting up Stash';
                    var percentage = null;

                    if (this.responseText) {
                        json = JSON.parse(this.responseText);
                        var progress = json.progress;

                        message = progress.message;
                        percentage = progress.percentage;
                    }

                    progressEl.className = 'progress-indicator' + (serviceUnavailable ? ' unknown' : '');
                    setMessage(message);
                    setProgress(percentage);

                    // If the server is starting, or we're waiting to contact the service, continue to poll.
                    if (json && json.state === 'STARTING' || serviceUnavailable) {
                        setTimeout(poll, 500);
                    } else {
                        // When the server's state moves from STARTING to anything else, reload the page.
                        // This is better than checking progress because it handles startup failure
                        location.reload()
                    }
                };

                request.open('get', contextPath + '/system/startup', true);
                request.setRequestHeader('Accept', 'application/json');
                // Set the if-modified-since header to the current time to prevent
                // some browsers from caching the request results.
                request.setRequestHeader("If-Modified-Since", new Date().toUTCString());
                request.send();
            }, 500);
        }());
    </script>
</body>
</html>
