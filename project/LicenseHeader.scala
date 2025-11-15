import de.heikoseeberger.sbtheader.HeaderPlugin.autoImport.HeaderLicense

import java.time.LocalDateTime
object LicenseHeader {
  def header(startYear: Option[Int]) = Some(
    HeaderLicense.Custom(
      s"""|SPDX-FileCopyrightText: ${startYear.getOrElse(LocalDateTime.now().getYear)} Benjamin Saff and contributors
          |SPDX-License-Identifier: MIT
          |""".stripMargin
    )
  )
}
